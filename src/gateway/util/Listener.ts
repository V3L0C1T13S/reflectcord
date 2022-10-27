/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
import { GatewayCloseCodes, GatewayDispatchEvents, GatewayOpcodes } from "discord.js";
import { API } from "revolt.js";
import { APIWrapper, createAPI } from "../../common/rvapi";
import {
  Channel, Emoji, Guild, Member, Message, PartialEmoji, Relationship, selfUser, User,
} from "../../common/models";
import { WebSocket } from "../Socket";
import { Send } from "./send";
import experiments from "./experiments.json";
import { toSnowflake } from "../../common/models/util";
import { Logger } from "../../common/utils";

export async function startListener(this: WebSocket, token: string) {
  this.rvClient.on("packet", async (data) => {
    try {
      switch (data.type) {
        case "Ready": {
          const currentUser = data.users.find((x) => x.relationship === "User");
          if (!currentUser) return this.close(GatewayCloseCodes.AuthenticationFailed);

          if (currentUser.bot) {
            this.rvAPI = createAPI(token);
          } else {
            this.rvAPI = createAPI({
              token,
            });
          }
          this.rvAPIWrapper = new APIWrapper(this.rvAPI);

          const users = await Promise.all(data.users
            .map((user) => User.from_quark(user)));
          const channels = await Promise.all(data.channels
            .filter((channel) => channel.channel_type === "DirectMessage")
            .map((channel) => Channel.from_quark(channel, currentUser._id)));
          const guilds = await Promise.all(data.servers
            .map(async (server) => {
              const rvChannels: API.Channel[] = server.channels
                .map((x) => {
                  const ch = this.rvClient.channels.get(x);

                  const channel: API.Channel = {
                    _id: x,
                    name: ch?.name ?? "fixme",
                    description: ch?.description ?? "fixme",
                    channel_type: ch?.channel_type as any ?? "TextChannel",
                    default_permissions: ch?.default_permissions ?? null,
                    server: "",
                    nsfw: !!ch?.nsfw,
                    icon: ch?.icon ?? null,
                    last_message_id: ch?.last_message_id ?? null,
                  };

                  if (ch?.role_permissions) channel.role_permissions = ch.role_permissions;
                  if (ch?.server_id) channel.server = ch.server_id; // @ts-ignore
                  else delete channel.server;

                  return channel;
                });

              return {
                ...await Guild.from_quark(server),
                channels: await Promise.all(rvChannels.map((ch) => Channel.from_quark(ch))),
              };
            }));

          const mfaInfo = !currentUser.bot ? await this.rvAPI.get("/auth/mfa/") : null;
          const authInfo = !currentUser.bot ? await this.rvAPI.get("/auth/account/") : null;
          const currentUserDiscord = await selfUser.from_quark({
            user: currentUser,
            authInfo: authInfo ?? {
              _id: currentUser._id,
              email: "fixme@gmail.com",
            },
            mfaInfo,
          });

          const members = await Promise.all(data.members.map((x) => Member.from_quark(x)));

          const mergedMembers = members.map((member) => [{
            ...member,
            roles: member.roles,
            settings: undefined,
            guild: undefined,
          }]);

          const relationships = await Promise.all(data.users
            .filter((u) => u.relationship !== "None" && u.relationship !== "User")
            .map(async (u) => ({
              type: await Relationship.from_quark(u.relationship ?? "Friend"),
              user: await User.from_quark(u),
            })));

          const readyData = {
            v: 8,
            application: currentUserDiscord.bot ? {
              id: currentUserDiscord.id,
              flags: 0,
            } : {
              id: "",
              flags: 0,
            },
            user: currentUserDiscord,
            user_settings: {},
            guilds,
            guild_experiments: [],
            geo_ordered_rtc_regions: [],
            relationships: relationships.map((x) => ({
              id: x.user.id,
              type: x.type,
              nickname: x.user.username,
              user: x.user,
            })),
            read_state: {
              entries: [],
              partial: false,
              version: 304128,
            },
            user_guild_settings: {
              entries: [],
              partial: false,
              version: 642,
            },
            users,
            experiments, // ily fosscord
            private_channels: channels,
            session_id: this.rvClient.session,
            friend_suggestion_count: 0,
            guild_join_requests: [],
            connected_accounts: [],
            analytics_token: "",
            consents: {
              personalization: {
                consented: false, // never gonna fix this lol
              },
            },
            country_code: "US",
            merged_members: mergedMembers,
          };

          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.Ready,
            s: this.sequence++,
            d: readyData,
          });

          break;
        }
        case "Message": {
        // We don't want to send Discord system stuff, since they dont have IDs
          if (!data.system) {
            const discordMsg = await Message.from_quark(data);
            const author = await this.rvAPIWrapper.users.getUser(data.author);
            const channel = await this.rvClient.channels.get(data.channel);
            await Send(this, {
              op: GatewayOpcodes.Dispatch,
              t: GatewayDispatchEvents.MessageCreate,
              s: this.sequence++,
              d: {
                ...discordMsg,
                author: author.discord,
                guild_id: channel?.server_id ? await toSnowflake(channel.server_id) : null,
              },
            });
          } else Logger.log("message is system message");

          break;
        }
        case "MessageUpdate": {
          if (!data.data._id || !data.data.author || ("system" in data)) return;

          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.MessageUpdate,
            s: this.sequence++,
            d: await Message.from_quark({
              _id: data.data._id, // FIXME: this might crash if undef.
              channel: data.channel,
              author: data.data.author,
              content: data.data.content ?? null,
              embeds: data.data.embeds ?? null,
              attachments: data.data.attachments ?? null,
              system: data.data.system ?? null,
              masquerade: data.data.masquerade ?? null,
              edited: data.data.edited ?? null,
            }),
          });
          break;
        }
        case "MessageDelete": {
          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.MessageDelete,
            s: this.sequence++,
            d: {
              id: await toSnowflake(data.id),
              channel_id: await toSnowflake(data.channel),
            // guild_id: null, // FIXME
            },
          });
          break;
        }
        case "MessageReact": {
          const emoji = await this.rvAPI.get(`/custom/emoji/${data.emoji_id}`) as API.Emoji;
          if (!emoji) return;

          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.MessageReactionAdd,
            s: this.sequence++,
            d: {
              user_id: await toSnowflake(data.user_id),
              channel_id: await toSnowflake(data.channel_id),
              message_id: await toSnowflake(data.id),
              emoji: await PartialEmoji.from_quark(emoji),
            },
          });
          break;
        }
        case "MessageUnreact": {
          const emoji = await this.rvAPI.get(`/custom/emoji/${data.emoji_id}`) as API.Emoji;
          if (!emoji) return;

          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.MessageReactionRemove,
            s: this.sequence++,
            d: {
              user_id: await toSnowflake(data.user_id),
              channel_id: await toSnowflake(data.channel_id),
              message_id: await toSnowflake(data.id),
              emoji: await PartialEmoji.from_quark(emoji),
            },
          });
          break;
        }
        case "MessageRemoveReaction": {
          const emoji = await this.rvAPI.get(`/custom/emoji/${data.emoji_id}`) as API.Emoji;
          if (!emoji) return;

          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.MessageReactionRemoveEmoji,
            s: this.sequence++,
            d: {
              channel_id: await toSnowflake(data.channel_id),
              message_id: await toSnowflake(data.id),
              emoji: await PartialEmoji.from_quark(emoji),
            },
          });
          break;
        }
        case "BulkMessageDelete": {
          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.MessageDeleteBulk,
            s: this.sequence++,
            d: {
              ids: await Promise.all(data.ids.map((x) => toSnowflake(x))),
              channel_id: await toSnowflake(data.channel),
              // guild_id: null, //FIXME
            },
          });

          break;
        }
        case "ChannelStartTyping": {
          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.TypingStart,
            s: this.sequence++,
            d: {
              channel_id: await toSnowflake(data.id),
              user_id: await toSnowflake(data.user),
              timestamp: Date.now().toString(),
            },
          });
          break;
        }
        case "ChannelCreate": {
          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.ChannelCreate,
            s: this.sequence++,
            d: await Channel.from_quark(data),
          });
          break;
        }
        case "ChannelDelete": {
          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.ChannelDelete,
            s: this.sequence++,
            d: await Channel.from_quark({
              _id: data.id,
              channel_type: "DirectMessage",
              active: false,
              recipients: [],
            }),
          });
          break;
        }
        case "ServerCreate": {
          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.GuildCreate,
            s: this.sequence++,
            d: await Guild.from_quark(data.server),
          });
          break;
        }
        case "ServerDelete": {
          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.GuildDelete,
            s: this.sequence++,
            d: {
              id: await toSnowflake(data.id),
              unavailable: true,
            },
          });
          break;
        }
        case "ServerMemberUpdate": {
          const { nickname, joined_at, timeout } = data.data;

          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.GuildMemberUpdate,
            s: this.sequence++,
            d: {
              guild_id: await toSnowflake(data.id.server),
              roles: data.data.roles?.map((x) => toSnowflake(x)) ?? [],
              user: await User.from_quark({
                ...data.data,
                _id: data.id.user,
                username: nickname ?? "fixme",
              }),
              nick: nickname,
              joined_at: joined_at ? new Date(joined_at).toISOString() : undefined,
              avatar: data.data.avatar?._id,
              communication_disabled_until: timeout ? new Date(timeout).toISOString() : undefined,
            },
          });

          break;
        }
        case "ChannelStopTyping": {
        // Discord wont handle this no matter what
          break;
        }
        case "UserUpdate": {
          /*
          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.UserUpdate,
            s: this.sequence++,
            d: await User.from_quark({
              _id: data.id,
              username: data.data.username ?? "fixme",
              flags: data.data.flags ?? null,
            }),
          });
          */
          break;
        }
        case "ChannelAck": {
          const msg = this.rvClient.messages.get(data.message_id);

          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: "MESSAGE_ACK",
            s: this.sequence++,
            d: {
              channel_id: msg?.channel_id ? await toSnowflake(msg?.channel_id) : undefined,
              message_id: await toSnowflake(data.message_id),
              version: 3763,
            },
          });
          break;
        }
        case "EmojiCreate": {
          if (data.parent.type !== "Server") return;

          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.GuildEmojisUpdate,
            s: this.sequence++,
            d: {
              guild_id: await toSnowflake(data.parent.id),
              emojis: [await Emoji.from_quark(data)],
            },
          });

          break;
        }
        case "ServerRoleDelete": {
          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.GuildRoleDelete,
            s: this.sequence++,
            d: {
              guild_id: await toSnowflake(data.id),
              role_id: await toSnowflake(data.role_id),
            },
          });

          break;
        }
        case "Pong": {
          break;
        }
        default: {
          Logger.warn(`Unknown event type ${data.type}`);
          break;
        }
      }
    } catch (e) {
      Logger.error(`Error during ws handle: ${e}`);
    }
  });
}

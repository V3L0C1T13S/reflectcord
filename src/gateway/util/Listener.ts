/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
import {
  GatewayCloseCodes,
  GatewayDispatchEvents,
  GatewayGuildRoleDeleteDispatchData,
  GatewayGuildRoleUpdateDispatchData,
  GatewayMessageCreateDispatchData,
  GatewayMessageDeleteBulkDispatchData,
  GatewayMessageDeleteDispatchData,
  GatewayMessageReactionAddDispatchData,
  GatewayMessageReactionRemoveDispatchData,
  GatewayMessageReactionRemoveEmojiDispatchData,
  GatewayMessageUpdateDispatchData,
  GatewayOpcodes,
  GatewayTypingStartDispatchData,
} from "discord.js";
import { API } from "revolt.js";
import { APIWrapper, createAPI, systemUserID } from "@reflectcord/common/rvapi";
import {
  Channel,
  Emoji,
  Guild,
  HandleChannelsAndCategories,
  Member,
  PartialEmoji,
  Relationship,
  selfUser,
  Status,
  User,
  toSnowflake,
  GuildCategory,
  fromSnowflake,
  SettingsKeys,
  RevoltSettings,
  UserSettings,
  settingsToProtoBuf,
  ReadState,
  GatewayGuildEmoji,
  Role,
} from "@reflectcord/common/models";
import { genSessionId, Logger, RabbitMQ } from "@reflectcord/common/utils";
import { userStartTyping } from "@reflectcord/common/events";
import { GatewayUserChannelUpdateOptional, IdentifySchema } from "@reflectcord/common/sparkle";
import { reflectcordWsURL } from "@reflectcord/common/constants";
import { listenEvent, eventOpts } from "@reflectcord/common/Events";
import { GatewayDispatchCodes } from "@reflectcord/common/sparkle/schemas/Gateway/Dispatch";
import { DbManager } from "@reflectcord/common/db";
import { WebSocket } from "../Socket";
import { Dispatch, Send } from "./send";
import experiments from "./experiments.json";

const voiceStates = DbManager.client.db("reflectcord")
  .collection("voiceStates");

async function internalConsumer(this: WebSocket, opts: eventOpts) {
  try {
    const { data, event } = opts;
    const id = data.id as string;

    Logger.log(`got event ${event} with data ${JSON.stringify(data)}`);

    const consumer = internalConsumer.bind(this);

    switch (event) {
      case GatewayDispatchCodes.VoiceChannelEffectSend: {
        // TODO: Compare against real Discord to see if this is correct
        if (!this.voiceInfo.channel_id === data.channel_id) return;

        const channel = this.rvAPIWrapper.channels.get(await fromSnowflake(data.channel_id));
        if (channel && ("server" in channel.revolt) && channel.revolt.server) {
          data.guild_id = await toSnowflake(channel.revolt.server);
        }

        break;
      }
      case GatewayDispatchEvents.InviteCreate: {
        const user = await this.rvAPIWrapper.users.fetch(await fromSnowflake(data.inviter.id));

        data.inviter = user.discord;

        break;
      }
      default: {
        break;
      }
    }

    await Send(this, {
      op: GatewayOpcodes.Dispatch,
      t: event,
      d: data,
      s: this.sequence++,
    });
  } catch (e) {
    console.error("Error in consumer:", e);
  }
}

export async function createInternalListener(this: WebSocket) {
  const consumer = internalConsumer.bind(this);

  const opts: { acknowledge: boolean; channel?: any } = {
    acknowledge: true,
  };
  if (RabbitMQ.connection) {
    opts.channel = await RabbitMQ.connection.createChannel();
    // @ts-ignore
    opts.channel.queues = {};
  }

  this.events[this.rv_user_id] = await listenEvent(this.rv_user_id, consumer, opts);
  this.rvAPIWrapper.servers.forEach(async (server) => {
    this.events[server.revolt._id] = await listenEvent(server.revolt._id, consumer, opts);

    server.revolt.channels.forEach(async (channel) => {
      this.events[channel] = await listenEvent(channel, consumer, opts);
    });
  });
  this.rvAPIWrapper.channels.forEach(async (channel) => {
    if (this.events[channel.revolt._id]) return;

    this.events[channel.revolt._id] = await listenEvent(channel.revolt._id, consumer, opts);
  });

  this.once("close", () => {
    if (opts.channel) opts.channel.close();
    else {
      Object.values(this.events).forEach((x) => x());
      Object.values(this.member_events).forEach((x) => x());
    }
  });
}

export async function startListener(
  this: WebSocket,
  token: string,
  identifyPayload: IdentifySchema,
) {
  this.rvClient.on("packet", async (data) => {
    try {
      switch (data.type) {
        case "Ready": {
          const currentUser = data.users.find((x) => x.relationship === "User");
          if (!currentUser) return this.close(GatewayCloseCodes.AuthenticationFailed);

          this.bot = !!currentUser.bot;

          if (currentUser.bot) {
            this.rvAPI = createAPI(token);
          } else {
            this.rvAPI = createAPI({
              token,
            });
          }
          // HACK! Fixes #10
          this.rvClient.api = this.rvAPI;
          this.rvAPIWrapper = new APIWrapper(this.rvAPI);

          this.user_id = await toSnowflake(currentUser._id);
          this.rv_user_id = currentUser._id;

          this.session_id = genSessionId();

          this.typingConsumer = await RabbitMQ.channel?.consume(userStartTyping, (msg) => {
            if (!msg) return;

            const { channel, token: userToken } = JSON.parse(msg.content.toString());

            if (userToken === token) {
              this.rvClient.websocket.send({
                type: "BeginTyping",
                channel,
              });

              Logger.log(`started typing in ${channel}`);
            }
          }, { noAck: true });

          const users = await Promise.all(data.users
            .map(async (user) => this.rvAPIWrapper.users.createObj({
              revolt: user,
              discord: await User.from_quark(user),
            }).discord));

          await Promise.all(data.channels
            .map(async (channel) => this.rvAPIWrapper.channels.createObj({
              revolt: channel,
              discord: await Channel.from_quark(channel, { excludedUser: currentUser._id }),
            })));

          /**
           * FIXME: Doing this with the API wrapper on Erlpack/ETF encoding
           * crashes a lot of clients, so we have to re-instantiate everything
           */
          const private_channels = await Promise.all(data.channels
            .filter((x) => x.channel_type === "DirectMessage" || x.channel_type === "Group")
            .map((x) => Channel.from_quark(x, { excludedUser: currentUser._id })));

          const guilds = await Promise.all(data.servers
            .map(async (server) => {
              const rvChannels: API.Channel[] = server.channels
                .map((x) => this.rvAPIWrapper.channels.$get(x)?.revolt).filter((x) => x);

              const emojis = data.emojis
                ?.filter((x) => x.parent.type === "Server" && x.parent.id === server._id);

              const rvServer = this.rvAPIWrapper.servers.createObj({
                revolt: server,
                discord: await Guild.from_quark(server, {
                  emojis,
                }),
              });

              const discordGuild = rvServer.discord;

              const member = await rvServer.extra?.members
                .fetch(rvServer.revolt._id, this.rv_user_id);

              const commonGuild = {
                channels: await HandleChannelsAndCategories(
                  rvChannels,
                  server.categories,
                  server._id,
                ),
                joined_at: member?.discord.joined_at ?? new Date().toISOString(),
                large: false,
                member_count: discordGuild.approximate_member_count ?? 0,
                members: [member?.discord],
                threads: [],
                stage_instances: [],
                guild_scheduled_events: [],
              };

              const guild = {
                ...commonGuild,
                data_mode: "full",
                emojis: emojis ? await Promise.all(emojis
                  ?.map((x) => GatewayGuildEmoji.from_quark(x))) : [],
                id: discordGuild.id,
                lazy: true,
                premium_subscription_count: discordGuild.premium_subscription_count ?? 0,
                properties: discordGuild,
                roles: discordGuild.roles,
                stickers: [],
                version: 0,
              };

              const botGuild = {
                ...discordGuild,
                ...commonGuild,
              };

              if (currentUser.bot) {
                setTimeout(() => {
                  Send(this, {
                    op: GatewayOpcodes.Dispatch,
                    t: GatewayDispatchEvents.GuildCreate,
                    s: this.sequence++,
                    d: botGuild,
                  });
                }, 500);
                return { id: guild.id, unavailable: true };
              }

              return guild;
            }));

          if (data.emojis) {
            await Promise.all(data.emojis
              .filter((x) => x.parent.type === "Server")
              .map(async (x) => this.rvAPIWrapper.emojis.createObj({
                revolt: x,
                discord: await Emoji.from_quark(x),
              })));
          }

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
          this.rvAPIWrapper.users.createObj({
            revolt: currentUser,
            discord: currentUserDiscord,
          });

          const sessionStatus = await Status.from_quark(currentUser.status);
          const currentSession = {
            activities: sessionStatus.activities,
            client_info: {
              version: 0,
              client: "desktop",
              os: identifyPayload.properties?.os,
            },
            status: identifyPayload?.presence?.status ?? "offline",
          };
          const sessions = [currentSession];

          setImmediate(async () => {
            Send(this, {
              op: GatewayOpcodes.Dispatch,
              t: GatewayDispatchEvents.PresenceUpdate,
              s: this.sequence++,
              d: {
                user: currentUserDiscord,
                ...currentSession,
                client_status: currentSession.status,
              },
            });
          });

          await Promise.all(data.members.map(async (x) => {
            const server = this.rvAPIWrapper.servers.$get(x._id.server);
            server.extra?.members.createObj({
              revolt: x,
              discord: await Member.from_quark(x),
            });
          }));

          const members = await Promise.all(data.members.map((x) => Member.from_quark(x)));

          const mergedMembers = members.map((member) => ([{
            ...member,
            roles: member.roles,
            settings: undefined,
            guild: undefined,
          }]));

          const relationships = await Promise.all(data.users
            .filter((u) => u.relationship !== "None" && u.relationship !== "User")
            .map(async (u) => ({
              discord: {
                type: await Relationship.from_quark(u.relationship ?? "Friend"),
                user: await User.from_quark(u),
              },
              revolt: u,
            })));

          const rvSettings = !currentUser.bot ? await this.rvAPI.post("/sync/settings/fetch", {
            keys: SettingsKeys,
          }) as unknown as RevoltSettings : null;

          const user_settings = rvSettings ? await UserSettings.from_quark(rvSettings, {
            status: sessionStatus.status?.toString() || null,
          }) : null;
          if (user_settings) user_settings.id = currentUserDiscord.id;

          const user_settings_proto = rvSettings
            ? await settingsToProtoBuf(user_settings as any, {
              customStatusText: currentUser.status?.text,
            })
            : null;

          const unreads = await this.rvAPI.get("/sync/unreads");
          const readStateEntries = await Promise.all(unreads.map((x) => ReadState.from_quark(x)));

          const readyData = {
            v: 9,
            application: currentUserDiscord.bot ? {
              id: currentUserDiscord.id,
              flags: 0,
            } : {
              id: "",
              flags: 0,
            },
            user: currentUserDiscord,
            user_settings: user_settings ?? {},
            user_settings_proto: user_settings_proto ? Buffer.from(user_settings_proto).toString("base64") : null,
            guilds,
            guild_experiments: [],
            geo_ordered_rtc_regions: ["newark", "us-east"],
            relationships: relationships.map((x) => ({
              id: x.discord.user.id,
              type: x.discord.type,
              nickname: x.discord.user.username,
              user: x.discord.user,
            })),
            read_state: {
              entries: readStateEntries,
              partial: false,
              version: 304128,
            },
            user_guild_settings: {
              entries: user_settings?.user_guild_settings,
              partial: false,
              version: 642,
            },
            users,
            experiments, // ily fosscord
            private_channels,
            resume_gateway_url: reflectcordWsURL,
            session_id: this.session_id,
            sessions,
            friend_suggestion_count: 0,
            guild_join_requests: [],
            connected_accounts: [],
            analytics_token: "",
            api_code_version: 1,
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

          await createInternalListener.call(this);

          if (!currentUserDiscord.bot) {
            const friendPresences = await Promise.all(relationships.map(async (relationship) => {
              const rvUser = relationship.revolt;

              const status = await Status.from_quark(rvUser.status, {
                online: rvUser.online,
              });

              const presence = status.status === "invisible" ? "offline" : status.status ?? "offline";

              return {
                user: {
                  id: relationship.discord.user.id,
                },
                activities: status.activities,
                client_status: {
                  desktop: presence,
                },
                status: presence,
                last_modified: Date.now(),
              };
            }));

            const supplementalData = {
              guilds: await Promise.all(guilds.map(async (x) => ({
                id: x.id,
                embedded_activities: [],
                voice_states: (await voiceStates.find({ guild_id: x.id }).toArray()),
              }))),
              lazy_private_channels: [],
              merged_members: [],
              merged_presences: {
                friends: friendPresences,
                guilds: [],
              },
            };

            await Send(this, {
              op: GatewayOpcodes.Dispatch,
              t: "READY_SUPPLEMENTAL",
              s: this.sequence++,
              d: supplementalData,
            });
          }

          break;
        }
        case "Message": {
          const msgObj = await this.rvAPIWrapper.messages.convertMessageObj(data);
          const channel = await this.rvAPIWrapper.channels.fetch(data.channel);

          this.rvAPIWrapper.channels.update(data.channel, {
            revolt: {
              last_message_id: data._id,
            },
            discord: {
              last_message_id: await toSnowflake(data._id),
            },
          });

          const body: GatewayMessageCreateDispatchData = msgObj.discord;

          if ("guild_id" in channel.discord && channel.discord.guild_id && "server" in channel.revolt) {
            const server = await this.rvAPIWrapper.servers.fetch(channel.revolt.server);

            body.guild_id = channel.discord.guild_id;

            if (data.author !== systemUserID) {
              const member = await server.extra?.members
                .fetch(channel.revolt.server, data.author);

              if (member) body.member = member.discord;
            }
          }

          await Dispatch(this, GatewayDispatchEvents.MessageCreate, body);

          break;
        }
        case "MessageUpdate": {
          const msgObj = await this.rvAPIWrapper.messages.getMessage(data.channel, data.id);
          const channel = await this.rvAPIWrapper.channels.fetch(data.channel);

          const body: GatewayMessageUpdateDispatchData = msgObj.discord;

          if ("guild_id" in channel.discord && channel.discord.guild_id) body.guild_id = channel.discord.guild_id;

          await Dispatch(this, GatewayDispatchEvents.MessageUpdate, body);

          break;
        }
        case "MessageDelete": {
          const channel = await this.rvAPIWrapper.channels.fetch(data.channel);

          const body: GatewayMessageDeleteDispatchData = {
            id: await toSnowflake(data.id),
            channel_id: channel.discord.id,
          };

          if ("guild_id" in channel.discord && channel.discord.guild_id) body.guild_id = channel.discord.guild_id;

          await Dispatch(this, GatewayDispatchEvents.MessageDelete, body);

          break;
        }
        case "MessageReact": {
          const emoji = await this.rvAPIWrapper.emojis.fetch(data.emoji_id);

          const body: GatewayMessageReactionAddDispatchData = {
            user_id: await toSnowflake(data.user_id),
            channel_id: await toSnowflake(data.channel_id),
            message_id: await toSnowflake(data.id),
            emoji: await PartialEmoji.from_quark(emoji.revolt),
          };

          if (emoji.revolt.parent.type === "Server") {
            body.guild_id = await toSnowflake(emoji.revolt.parent.id);
          }

          await Dispatch(this, GatewayDispatchEvents.MessageReactionAdd, body);

          break;
        }
        case "MessageUnreact": {
          const emoji = await this.rvAPIWrapper.emojis.fetch(data.emoji_id);

          const body: GatewayMessageReactionRemoveDispatchData = {
            user_id: await toSnowflake(data.user_id),
            channel_id: await toSnowflake(data.channel_id),
            message_id: await toSnowflake(data.id),
            emoji: await PartialEmoji.from_quark(emoji.revolt),
          };

          if (emoji.revolt.parent.type === "Server") {
            body.guild_id = await toSnowflake(emoji.revolt.parent.id);
          }

          await Dispatch(this, GatewayDispatchEvents.MessageReactionRemove, body);

          break;
        }
        case "MessageRemoveReaction": {
          const emoji = await this.rvAPIWrapper.emojis.fetch(data.emoji_id);

          const body: GatewayMessageReactionRemoveEmojiDispatchData = {
            channel_id: await toSnowflake(data.channel_id),
            message_id: await toSnowflake(data.id),
            emoji: await PartialEmoji.from_quark(emoji.revolt),
          };

          if (emoji.revolt.parent.type === "Server") {
            body.guild_id = await toSnowflake(emoji.revolt.parent.id);
          }

          await Dispatch(this, GatewayDispatchEvents.MessageReactionRemoveEmoji, body);

          break;
        }
        case "MessageAppend": {
          const msg = await this.rvAPIWrapper.messages.getMessage(data.channel, data.id);
          const channel = await this.rvAPIWrapper.channels.fetch(data.channel);

          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.MessageUpdate,
            s: this.sequence++,
            d: {
              ...msg.discord,
              guild_id: channel?.discord && ("guild_id" in channel.discord) ? channel?.discord.guild_id : null,
            },
          });
          break;
        }
        case "BulkMessageDelete": {
          const channel = this.rvAPIWrapper.channels.$get(data.channel);

          const body: GatewayMessageDeleteBulkDispatchData = {
            ids: await Promise.all(data.ids.map((x) => toSnowflake(x))),
            channel_id: await toSnowflake(data.channel),
          };

          if ("guild_id" in channel.discord && channel.discord.guild_id) {
            body.guild_id = channel.discord.guild_id;
          }

          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.MessageDeleteBulk,
            s: this.sequence++,
            d: body,
          });

          break;
        }
        case "ChannelStartTyping": {
          const channel = await this.rvAPIWrapper.channels.fetch(data.id);

          const body: GatewayTypingStartDispatchData = {
            channel_id: channel.discord.id,
            user_id: await toSnowflake(data.user),
            timestamp: Date.now(),
          };

          if ("guild_id" in channel.discord && channel.discord.guild_id && "server" in channel.revolt) {
            if (!this.bot && !this.subscribed_servers[channel.revolt.server]?.typing) {
              return;
            }
            body.guild_id = channel.discord.guild_id;
          }

          await Dispatch(this, GatewayDispatchEvents.TypingStart, body);

          break;
        }
        case "ChannelCreate": {
          const channel = this.rvAPIWrapper.channels.createObj({
            revolt: data,
            discord: await Channel.from_quark(data),
          });

          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.ChannelCreate,
            s: this.sequence++,
            d: channel.discord,
          });
          break;
        }
        case "ChannelUpdate": {
          const channelHandle = this.rvAPIWrapper.channels.get(data.id);
          if (channelHandle) {
            this.rvAPIWrapper.channels.update(data.id, {
              revolt: data.data,
              discord: await Channel.from_quark({
                ...channelHandle.revolt,
                ...data.data,
              } as API.Channel),
            });

            const body: GatewayUserChannelUpdateOptional = {
              ...channelHandle.discord,
            };

            if (!this.bot) {
              const stubGatewayHash = {
                hash: "NpY9iQ",
              };
              const stubHash = {
                channels: stubGatewayHash,
                metadata: stubGatewayHash,
                roles: stubGatewayHash,
                version: 1,
              };
              body.guild_hashes = stubHash;
              body.version = 1671679879788;
            }

            await Dispatch(this, GatewayDispatchEvents.ChannelUpdate, body);
          }

          break;
        }
        case "ChannelDelete": {
          const channel = this.rvAPIWrapper.channels.get(data.id);

          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.ChannelDelete,
            s: this.sequence++,
            d: channel?.discord ?? await Channel.from_quark({
              _id: data.id,
              channel_type: "DirectMessage",
              active: false,
              recipients: [],
            }),
          });
          break;
        }
        case "ServerCreate": {
          const guild = this.rvAPIWrapper.servers.createObj({
            revolt: data.server,
            discord: await Guild.from_quark(data.server),
          });

          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.GuildCreate,
            s: this.sequence++,
            d: guild.discord,
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
            },
          });
          break;
        }
        case "ServerUpdate": {
          const oldServer = this.rvAPIWrapper.servers.$get(data.id);
          const server = this.rvAPIWrapper.servers.$get(data.id, {
            revolt: data.data ?? {},
            discord: {},
          });

          if (!server?.revolt) return;

          const guild = await Guild.from_quark(server.revolt);
          const updatedGuild = this.rvAPIWrapper.servers.$get(data.id, {
            revolt: {},
            discord: guild,
          });

          if (data.data.categories) {
            await Promise.all(data.data.categories.map(async (x) => {
              // Only emit channelcreate for new categories - the rest get "updated"
              const eventType = oldServer.revolt.categories?.find((c) => x.id === c.id)
                ? GatewayDispatchEvents.ChannelUpdate
                : GatewayDispatchEvents.ChannelCreate;

              const discordCategory = await GuildCategory.from_quark(x, {
                server: data.id,
              });

              await Dispatch(this, eventType, discordCategory);
            }));
          }

          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.GuildUpdate,
            s: this.sequence++,
            d: updatedGuild.discord,
          });
          break;
        }
        case "ServerMemberJoin": {
          const member = await this.rvAPI.get(`/servers/${data.id as ""}/members/${data.user as ""}`);

          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.GuildMemberAdd,
            s: this.sequence++,
            d: {
              ...await Member.from_quark(member),
              guild_id: await toSnowflake(data.id),
            },
          });

          break;
        }
        case "ServerMemberUpdate": {
          await this.rvAPIWrapper.members.fetch(data.id.server, data.id.user);

          const updatedMember = this.rvAPIWrapper.members.$get(data.id.user, {
            revolt: data.data,
            discord: {},
          });

          const updatedMemberDiscord = this.rvAPIWrapper.members.$get(data.id.user, {
            revolt: {},
            discord: await Member.from_quark(updatedMember.revolt),
          });

          // TODO: Update the member list if subscribed
          await Dispatch(
            this,
            GatewayDispatchEvents.GuildMemberUpdate,
            updatedMemberDiscord.discord,
          );

          /*
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
          */

          break;
        }
        case "ServerMemberLeave": {
          // TODO: Validate if this is correct
          if (data.user === this.rv_user_id) {
            await Send(this, {
              op: GatewayOpcodes.Dispatch,
              t: GatewayDispatchEvents.GuildDelete,
              s: this.sequence++,
              d: {
                id: await toSnowflake(data.id),
              },
            });

            return;
          }

          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.GuildMemberRemove,
            s: this.sequence++,
            d: {
              guild_id: await toSnowflake(data.id),
              user: await toSnowflake(data.user),
            },
          });

          break;
        }
        case "ChannelStopTyping": {
        // Discord wont handle this no matter what
          break;
        }
        case "UserUpdate": {
          // Just incase we don't have them cached yet
          await this.rvAPIWrapper.users.fetch(data.id);

          const currentUser = this.rvAPIWrapper.users.$get(data.id, {
            revolt: data.data ?? {},
            discord: {},
          });

          if (!currentUser?.revolt) return;

          const updatedUser = this.rvAPIWrapper.users.$get(data.id, {
            revolt: {},
            discord: await User.from_quark({
              ...currentUser.revolt,
              ...data.data,
            }),
          });

          if (data.id !== this.rv_user_id) {
            if (data.data.status || data.data.online !== null || data.data.online !== undefined) {
              const status = await Status.from_quark(
                data.data.status ?? updatedUser.revolt.status,
                {
                  online: data.data.online,
                },
              );

              const presence = status.status === "invisible" ? "offline" : status.status;

              await Send(this, {
                op: GatewayOpcodes.Dispatch,
                t: GatewayDispatchEvents.PresenceUpdate,
                s: this.sequence++,
                d: {
                  activities: status.activities ?? [],
                  client_status: {
                    desktop: presence,
                  },
                  status: presence,
                  last_modified: Date.now(),
                  // FIXME: Discord has inconsistent behaviour with the user object
                  user: updatedUser.discord,
                },
              });
            }

            return;
          }

          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.UserUpdate,
            s: this.sequence++,
            d: updatedUser.discord,
          });

          break;
        }
        case "ChannelAck": {
          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: "MESSAGE_ACK",
            s: this.sequence++,
            d: {
              channel_id: await toSnowflake(data.id),
              message_id: await toSnowflake(data.message_id),
              version: 3763,
            },
          });
          break;
        }
        case "EmojiCreate": {
          if (data.parent.type !== "Server") return;

          const emoji = this.rvAPIWrapper.emojis.createObj({
            revolt: data,
            discord: await Emoji.from_quark(data),
          });

          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.GuildEmojisUpdate,
            s: this.sequence++,
            d: {
              guild_id: await toSnowflake(data.parent.id),
              emojis: [emoji.discord],
            },
          });

          break;
        }
        case "ServerRoleUpdate": {
          const server = this.rvAPIWrapper.servers.get(data.id);
          if (server) {
            const rvRole = {
              ...server.revolt.roles?.[data.role_id],
              ...data.data,
            } as API.Role;
            const discordRole = await Role.from_quark(rvRole, data.role_id);
            let existingDiscord = server.discord.roles.find((x) => x.id === discordRole.id);
            const isUpdate = !!existingDiscord;

            existingDiscord = {
              ...existingDiscord,
              ...discordRole,
            };
            if (!isUpdate) server.discord.roles.push(existingDiscord);

            server.revolt.roles = {
              ...server.revolt.roles,
              [data.role_id]: rvRole,
            };

            const body: GatewayGuildRoleUpdateDispatchData = {
              guild_id: server.discord.id,
              role: discordRole,
            };

            const dispatchType = isUpdate
              ? GatewayDispatchEvents.GuildRoleUpdate
              : GatewayDispatchEvents.GuildRoleCreate;

            await Dispatch(this, dispatchType, body);
          }

          break;
        }
        case "ServerRoleDelete": {
          const server = this.rvAPIWrapper.servers.get(data.id);
          if (server) {
            const { [data.role_id]: _, ...roles } = server.revolt.roles ?? {};
            const discordRoleId = await toSnowflake(data.role_id);
            server.revolt.roles = roles;
            server.discord.roles = server.discord.roles.filter((x) => x.id !== discordRoleId);

            const body: GatewayGuildRoleDeleteDispatchData = {
              guild_id: server.discord.id,
              role_id: discordRoleId,
            };

            await Dispatch(this, GatewayDispatchEvents.GuildRoleDelete, body);
          }
          break;
        }
        case "UserRelationship": {
          const id = await toSnowflake(data.user._id);
          const type = await Relationship.from_quark(data.status);
          const nickname = data.user.username;
          const user = await User.from_quark(data.user);

          if (["Friend", "Outgoing", "Incoming", "Blocked"].includes(data.status)) {
            await Send(this, {
              op: GatewayOpcodes.Dispatch,
              t: "RELATIONSHIP_ADD",
              s: this.sequence++,
              d: {
                id,
                type,
                nickname,
                user,
              },
            });
          } else {
            await Send(this, {
              op: GatewayOpcodes.Dispatch,
              t: "RELATIONSHIP_REMOVE",
              s: this.sequence++,
              d: {
                id,
                type,
                nickname,
                user,
              },
            });
          }
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
      console.error("Error during ws handle:", e);
    }
  });
}

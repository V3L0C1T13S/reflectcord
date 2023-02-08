/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
import {
  APIChannel,
  GatewayChannelDeleteDispatchData,
  GatewayCloseCodes,
  GatewayDispatchEvents,
  GatewayGuildCreateDispatchData,
  GatewayGuildDeleteDispatchData,
  GatewayGuildMemberAddDispatchData,
  GatewayGuildMemberRemoveDispatchData,
  GatewayGuildMemberUpdateDispatchData,
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
  createCommonGatewayGuild,
  createUserPresence,
} from "@reflectcord/common/models";
import { Logger, RabbitMQ, toCompatibleISO } from "@reflectcord/common/utils";
import { userStartTyping } from "@reflectcord/common/events";
import {
  GatewayUserChannelUpdateOptional,
  IdentifySchema,
  GatewayUserSettingsProtoUpdateDispatchData,
  GatewayDispatchCodes,
} from "@reflectcord/common/sparkle";
import { discordEpoch, reflectcordWsURL } from "@reflectcord/common/constants";
import { VoiceState } from "@reflectcord/common/mongoose";
import { WebSocket } from "../Socket";
import { Dispatch, Send } from "./send";
import experiments from "./experiments.json";
import { isDeprecatedClient } from "../versioning";
import { updateMessage } from "./messages";
import { createInternalListener } from "./InternalListener";

// TODO: rework lol
function cacheServerCreateChannels(
  this: WebSocket,
  rvChannels: API.Channel[],
  discordChannels: APIChannel[],
) {
  rvChannels.forEach((x) => {
    const channelHandler = this.rvAPIWrapper.channels.get(x._id);
    if (!channelHandler
      || !(
        "guild_id" in channelHandler.discord
        && channelHandler.discord.guild_id
      )) return;

    const discordChannel = discordChannels
      .find((ch) => ch.id === channelHandler?.discord.id);

    if (!discordChannel || !("parent_id" in discordChannel && discordChannel.parent_id)) return;
    channelHandler.discord.parent_id = discordChannel.parent_id;
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
        // @ts-ignore
        case "NotFound": {
          this.close(GatewayCloseCodes.AuthenticationFailed);
          break;
        }
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
            this.enable_lazy_channels = process.env["LAZY_MESSAGES"] as unknown as boolean ?? false;
          }
          // HACK! Fixes #10
          this.rvClient.api = this.rvAPI;
          this.rvAPIWrapper = new APIWrapper(this.rvAPI);

          this.user_id = await toSnowflake(currentUser._id);
          this.rv_user_id = currentUser._id;

          this.is_deprecated = isDeprecatedClient.call(this);
          if (identifyPayload.properties.browser === "Discord Android") {
            this.is_deprecated = true;
          }

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
            })));

          const discordUsers = users.map((user) => user.discord);

          const channels = await Promise.all(data.channels
            .map(async (channel) => this.rvAPIWrapper.channels.createObj({
              revolt: channel,
              discord: await Channel.from_quark(channel, { excludedUser: currentUser._id }),
            })));

          const private_channels = channels
            .filter((x) => x.revolt.channel_type === "DirectMessage" || x.revolt.channel_type === "Group" || x.revolt.channel_type === "SavedMessages")
            .map((x) => x.discord);

          const lazyGuilds: GatewayGuildCreateDispatchData[] = [];

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

              const serverChannels = await HandleChannelsAndCategories(
                rvChannels,
                server.categories,
                server._id,
                this.is_deprecated,
              );

              cacheServerCreateChannels.call(this, rvChannels, serverChannels);

              const commonGuild = createCommonGatewayGuild(discordGuild, {
                channels: serverChannels,
                members: member ? [member.discord] : [],
                member: member ? member.discord : null,
              });

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
                stickers: discordGuild.stickers,
                version: 0,
              };

              const botGuild = {
                ...discordGuild,
                ...commonGuild,
                unavailable: false,
              };

              const legacyGuild = botGuild;

              if (currentUser.bot) {
                lazyGuilds.push(botGuild);
                return { id: guild.id, unavailable: true };
              }

              // Older clients expect bot guilds
              if ((this.version < 9 && !this.bot) || this.is_deprecated) {
                return legacyGuild;
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
            session_id: this.session_id,
          };
          const sessions = [currentSession];

          const memberData = (await Promise.all(data.members.map(async (x) => {
            const server = this.rvAPIWrapper.servers.$get(x._id.server);
            const member = {
              revolt: x,
              discord: await Member.from_quark(x),
            };

            server.extra?.members.createObj(member);

            return { member, guild: server.discord };
          })));

          const mergedMembers = memberData.map((member_data) => {
            const { guild, member } = member_data;

            // FIXME: Make role with highest ranking take priority
            const hoisted_role = guild.roles.find((role) => role.hoist
            && member.discord.roles.find((member_role) => member_role === role.id));

            const body: any = { ...member.discord };

            if (hoisted_role) body.hoisted_role = hoisted_role;

            return body;
          });

          const relationships = await Promise.all(users
            .filter((u) => u.revolt.relationship !== "None" && u.revolt.relationship !== "User")
            .map(async (u) => ({
              discord: {
                type: await Relationship.from_quark(u.revolt.relationship ?? "Friend"),
                user: u.discord,
              },
              revolt: u.revolt,
            })));

          const friendPresences = await Promise.all(relationships
            .map((relationship) => createUserPresence({
              user: relationship.revolt,
              discordUser: relationship.discord.user,
            })));

          const rvSettings = !currentUser.bot ? await this.rvAPI.post("/sync/settings/fetch", {
            keys: SettingsKeys,
          }) as unknown as RevoltSettings : null;

          const user_settings = rvSettings ? await UserSettings.from_quark(rvSettings, {
            status: sessionStatus.status?.toString() || null,
          }) : null;

          const user_settings_proto = rvSettings
            ? await settingsToProtoBuf(user_settings as any, {
              customStatusText: currentUser.status?.text,
            })
            : null;

          const unreads = await this.rvAPI.get("/sync/unreads");
          const readStateEntries = await Promise.all(unreads.map((x) => ReadState.from_quark(x)));

          const readyData = {
            v: this.version,
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
            read_state: this.version > 7 ? {
              entries: readStateEntries,
              partial: false,
              version: 304128,
            } : readStateEntries,
            user_guild_settings: this.version > 7 ? {
              entries: user_settings?.user_guild_settings,
              partial: false,
              version: 642,
            } : user_settings?.user_guild_settings ?? [],
            users: discordUsers,
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
            merged_members: [mergedMembers],
            // V6 & V7 garbo
            indicators_confirmed: [],
            notes: {},
            _trace: ["s2-gateway-prd-7-5"],
            shard: [0, 1],
            presences: friendPresences,
          };

          await Dispatch(this, GatewayDispatchEvents.Ready, readyData);

          await createInternalListener.call(this);

          await Promise.all(lazyGuilds
            .map((x) => Dispatch(this, GatewayDispatchEvents.GuildCreate, x).catch(Logger.error)));

          if (!currentUserDiscord.bot) {
            const supplementalData = {
              guilds: await Promise.all(guilds.map(async (x) => ({
                id: x.id,
                embedded_activities: [],
                voice_states: (await VoiceState.find({ guild_id: x.id })),
              }))),
              lazy_private_channels: [],
              merged_members: [],
              merged_presences: {
                friends: friendPresences,
                guilds: [],
              },
            };

            await Dispatch(this, GatewayDispatchCodes.ReadySupplemental, supplementalData);
          }

          setImmediate(async () => {
            if (this.bot) return;

            Dispatch(this, GatewayDispatchCodes.SessionsReplace, [currentSession])
              .catch(Logger.error);
            Dispatch(this, GatewayDispatchEvents.PresenceUpdate, {
              user: currentUserDiscord,
              ...currentSession,
              client_status: {
                desktop: currentSession.status,
              },
            }).catch(Logger.error);
          });

          break;
        }
        case "Message": {
          if (this.enable_lazy_channels && !this.lazy_channels[data.channel]) {
            return;
          }

          const msgObj = await this.rvAPIWrapper.messages.convertMessageObj(
            data,
            { mentions: true },
            { api_version: this.version },
          );
          this.rvAPIWrapper.messages.createObj({
            revolt: msgObj.revolt.message,
            discord: msgObj.discord,
          });
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
          if (this.enable_lazy_channels && !this.lazy_channels[data.channel]) {
            return;
          }

          await updateMessage.call(this, data);
          break;
        }
        case "MessageDelete": {
          if (this.enable_lazy_channels && !this.lazy_channels[data.channel]) {
            return;
          }

          const channel = await this.rvAPIWrapper.channels.fetch(data.channel);

          const body: GatewayMessageDeleteDispatchData = {
            id: await toSnowflake(data.id),
            channel_id: channel.discord.id,
          };

          if ("guild_id" in channel.discord && channel.discord.guild_id) body.guild_id = channel.discord.guild_id;

          await Dispatch(this, GatewayDispatchEvents.MessageDelete, body);

          this.rvAPIWrapper.messages.delete(data.id);

          break;
        }
        case "MessageReact": {
          if (this.enable_lazy_channels && !this.lazy_channels[data.channel_id]) {
            return;
          }

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
          if (this.enable_lazy_channels && !this.lazy_channels[data.channel_id]) {
            return;
          }

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
          if (this.enable_lazy_channels && !this.lazy_channels[data.channel_id]) {
            return;
          }
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
          if (this.enable_lazy_channels && !this.lazy_channels[data.channel]) {
            return;
          }

          await updateMessage.call(this, data);
          break;
        }
        case "BulkMessageDelete": {
          if (this.enable_lazy_channels && !this.lazy_channels[data.channel]) {
            return;
          }

          const channel = await this.rvAPIWrapper.channels.fetch(data.channel);

          const body: GatewayMessageDeleteBulkDispatchData = {
            ids: await Promise.all(data.ids.map((x) => toSnowflake(x))),
            channel_id: channel.discord.id,
          };

          if ("guild_id" in channel.discord && channel.discord.guild_id) {
            body.guild_id = channel.discord.guild_id;
          }

          await Dispatch(this, GatewayDispatchEvents.MessageDeleteBulk, body);

          data.ids.forEach((msg) => this.rvAPIWrapper.messages.delete(msg));

          break;
        }
        case "ChannelStartTyping": {
          const channel = await this.rvAPIWrapper.channels.fetch(data.id);

          const body: GatewayTypingStartDispatchData = {
            channel_id: channel.discord.id,
            user_id: await toSnowflake(data.user),
            timestamp: Date.nowSeconds(),
          };

          if ("guild_id" in channel.discord && channel.discord.guild_id && "server" in channel.revolt) {
            if (!this.bot
              && !this.is_deprecated
              && !this.subscribed_servers[channel.revolt.server]?.typing) {
              return;
            }
            body.guild_id = channel.discord.guild_id;
            body.member = (await this.rvAPIWrapper.members
              .fetch(channel.revolt.server, data.user)).discord;
          }

          await Dispatch(this, GatewayDispatchEvents.TypingStart, body);

          break;
        }
        case "ChannelCreate": {
          const channel = this.rvAPIWrapper.channels.createObj({
            revolt: data,
            discord: await Channel.from_quark(data),
          });

          if (channel.revolt.channel_type === "TextChannel" || channel.revolt.channel_type === "VoiceChannel") {
            const server = await this.rvAPIWrapper.servers.fetch(channel.revolt.server);
            if (!server.revolt.channels.includes(channel.revolt._id)) {
              server.revolt.channels.push(channel.revolt._id);
            }
          }

          await Dispatch(this, GatewayDispatchEvents.ChannelCreate, channel.discord);

          break;
        }
        case "ChannelUpdate": {
          const channelHandle = this.rvAPIWrapper.channels.get(data.id);
          if (channelHandle) {
            // TODO: Better clear functions
            this.rvAPIWrapper.channels.update(data.id, {
              revolt: data.data,
              discord: {},
            }, data.clear);

            this.rvAPIWrapper.channels.update(data.id, {
              revolt: data.data,
              discord: await Channel.from_quark({
                ...channelHandle.revolt,
                ...data.data,
              } as API.Channel),
            }, data.clear);

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

          await Dispatch(this, GatewayDispatchEvents.ChannelDelete, channel?.discord);

          if (channel) {
            await this.rvAPIWrapper.channels.deleteChannel(channel.revolt._id, false, true);
          }

          break;
        }
        case "ServerCreate": {
          await Promise.all(data.channels
            .map(async (x) => this.rvAPIWrapper.channels.createObj({
              revolt: x,
              discord: await Channel.from_quark(x),
            })));

          const channels = await HandleChannelsAndCategories(
            data.channels,
            data.server.categories,
            data.server._id,
            this.is_deprecated,
          );

          cacheServerCreateChannels.call(this, data.channels, channels);

          const guild = this.rvAPIWrapper.servers.createObj({
            revolt: data.server,
            discord: await Guild.from_quark(data.server),
          });

          const member = await this.rvAPIWrapper.members.fetch(data.server._id, this.rv_user_id);

          const commonGuild = createCommonGatewayGuild(guild.discord, {
            channels,
            members: member ? [member.discord] : [],
            member: member ? member.discord : null,
          });

          const userGuild = {
            ...commonGuild,
            id: guild.discord.id,
            properties: guild.discord,
            roles: guild.discord.roles,
            emojis: guild.discord.emojis,
            stickers: guild.discord.stickers,
            premium_subscription_count: guild.discord.premium_subscription_count ?? 0,
            embedded_activities: [],
          };

          const botGuild = {
            ...commonGuild,
            ...guild.discord,
            unavailable: false,
          };

          await Dispatch(this, GatewayDispatchEvents.GuildCreate, this.bot ? botGuild : userGuild);

          break;
        }
        case "ServerDelete": {
          const server = this.rvAPIWrapper.servers.get(data.id);

          await Dispatch(this, GatewayDispatchEvents.GuildDelete, {
            id: server?.discord.id ?? await toSnowflake(data.id),
          });

          if (server) {
            await this.rvAPIWrapper.servers.removeServer(server.revolt._id, false, true);
          }

          break;
        }
        case "ServerUpdate": {
          const server = this.rvAPIWrapper.servers.get(data.id);
          if (server) {
            const deletedCategories = server.revolt.categories
              ?.filter((category) => data.data.categories
                ?.find((x) => x.id === category.id) === undefined);

            const rvEmojis = Array.from(this.rvAPIWrapper.emojis.values())
              .filter((x) => x.revolt.parent.type === "Server" && x.revolt.parent.id === server.revolt._id);

            this.rvAPIWrapper.servers.update(server.revolt._id, {
              revolt: data.data,
              discord: await Guild.from_quark({
                ...server.revolt,
                ...data.data,
              }, {
                emojis: rvEmojis.map((x) => x.revolt),
              }),
            });

            if (data.data.categories) {
              await Promise.all(data.data.categories.map(async (x) => {
                // Only emit channelcreate for new categories - the rest get "updated"
                const eventType = server.revolt.categories?.find((c) => x.id === c.id)
                  ? GatewayDispatchEvents.ChannelUpdate
                  : GatewayDispatchEvents.ChannelCreate;

                const discordCategory = await GuildCategory.from_quark(x, {
                  server: data.id,
                });

                await Dispatch(this, eventType, discordCategory);

                await Promise.all(x.channels.map(async (id) => {
                  const channel = this.rvAPIWrapper.channels.get(id);
                  if (!channel || !("parent_id" in channel.discord)) return;

                  if (discordCategory.id === channel.discord.parent_id) return;

                  channel.discord.parent_id = discordCategory.id;
                  await Dispatch(this, GatewayDispatchEvents.ChannelUpdate, channel.discord);
                }));
              }));
            }

            if (deletedCategories) {
              await Promise.all(deletedCategories
                .map(async (category) => Dispatch(
                  this,
                  GatewayDispatchEvents.ChannelDelete,
                  await GuildCategory.from_quark(category),
                )));
            }

            await Dispatch(this, GatewayDispatchEvents.GuildUpdate, server.discord);
          }

          break;
        }
        case "ServerMemberJoin": {
          const server = this.rvAPIWrapper.servers.get(data.id);
          if (!server?.extra?.members) return;

          const member = await server.extra.members.fetch(data.id, data.user);

          const body: GatewayGuildMemberAddDispatchData = {
            ...member.discord,
            guild_id: await toSnowflake(data.id),
          };

          await Dispatch(this, GatewayDispatchEvents.GuildMemberAdd, body);

          break;
        }
        case "ServerMemberUpdate": {
          const server = this.rvAPIWrapper.servers.get(data.id.server);
          if (!server?.extra?.members) return;

          const member = await server.extra.members.fetch(data.id.server, data.id.user);
          server.extra.members.update(data.id.user, {
            revolt: data.data,
            discord: {},
          }, data.clear);

          server.extra.members.update(data.id.user, {
            revolt: data.data,
            discord: await Member.from_quark({
              ...member.revolt,
              ...data.data,
            }, {
              discordUser: member.discord.user,
            }),
          }, data.clear);

          const body: GatewayGuildMemberUpdateDispatchData = {
            ...member.discord,
            user: member.discord.user ?? (await this.rvAPIWrapper.users
              .fetch(data.id.user)).discord,
            guild_id: await toSnowflake(data.id.server),
          };

          // TODO: Update the member list if subscribed
          await Dispatch(
            this,
            GatewayDispatchEvents.GuildMemberUpdate,
            body,
          );

          break;
        }
        case "ServerMemberLeave": {
          const server = this.rvAPIWrapper.servers.get(data.id);

          const guildId = server?.discord.id ?? await toSnowflake(data.id);

          // TODO: Validate if this is correct
          if (data.user === this.rv_user_id) {
            const body: GatewayGuildDeleteDispatchData = {
              id: guildId,
              unavailable: false,
            };

            await this.rvAPIWrapper.servers.removeServer(data.id, false, true);

            await Dispatch(this, GatewayDispatchEvents.GuildDelete, body);

            return;
          }

          const user = await this.rvAPIWrapper.users.fetch(data.user);

          const body: GatewayGuildMemberRemoveDispatchData = {
            guild_id: guildId,
            user: user.discord,
          };

          await Dispatch(this, GatewayDispatchEvents.GuildMemberRemove, body);

          server?.extra?.members.delete(data.user);

          break;
        }
        case "ChannelStopTyping": {
          // Discord wont handle this no matter what
          break;
        }
        case "UserUpdate": {
          const user = await this.rvAPIWrapper.users.fetch(data.id);

          // TODO: Make it so we don't have to do this to clear revolt beforehand
          this.rvAPIWrapper.users.update(data.id, {
            revolt: data.data ?? {},
            discord: {},
          }, data.clear);

          this.rvAPIWrapper.users.update(data.id, {
            revolt: data.data ?? {},
            discord: await User.from_quark({
              ...user.revolt,
              ...data.data,
            }),
          }, data.clear);

          if (data.id !== this.rv_user_id) {
            if (data.data.status || data.data.online !== null || data.data.online !== undefined) {
              const updated = await createUserPresence({
                user: user.revolt,
                discordUser: user.discord,
              });

              await Dispatch(this, GatewayDispatchEvents.PresenceUpdate, updated);
            }

            return;
          }

          await Dispatch(this, GatewayDispatchEvents.UserUpdate, user.discord);

          break;
        }
        case "ChannelAck": {
          await Dispatch(this, GatewayDispatchCodes.MessageAck, {
            channel_id: await toSnowflake(data.id),
            message_id: await toSnowflake(data.message_id),
            version: 3763,
          });
          break;
        }
        case "EmojiCreate": {
          if (data.parent.type !== "Server") return;

          const emoji = this.rvAPIWrapper.emojis.createObj({
            revolt: data,
            discord: await Emoji.from_quark(data),
          });

          await Dispatch(this, GatewayDispatchEvents.GuildEmojisUpdate, {
            guild_id: await toSnowflake(data.parent.id),
            emojis: [emoji.discord],
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
          const user = await User.from_quark(data.user);
          const { id } = user;
          const type = await Relationship.from_quark(data.status);
          const nickname = data.user.username;

          const body = {
            id,
            type,
            nickname,
            user,
          };

          if (["Friend", "Outgoing", "Incoming", "Blocked"].includes(data.status)) {
            await Dispatch(this, GatewayDispatchCodes.RelationshipAdd, body);
          } else {
            await Dispatch(this, GatewayDispatchCodes.RelationshipRemove, body);
          }

          break;
        }
        case "UserSettingsUpdate": {
          const user = this.rvAPIWrapper.users.get(this.rv_user_id);
          if (!user) return;

          const currentSettings = await this.rvAPI.post("/sync/settings/fetch", {
            keys: SettingsKeys,
          }) as RevoltSettings;

          const discordSettings = await UserSettings.from_quark(currentSettings, {
            status: user.revolt.status
              ? (await Status.from_quark(user.revolt.status)).status ?? null
              : null,
          });

          const settingsProto = await settingsToProtoBuf(discordSettings, {
            customStatusText: user.revolt.status?.text,
          });

          const body: GatewayUserSettingsProtoUpdateDispatchData = {
            partial: false,
            settings: {
              proto: Buffer.from(settingsProto).toString("base64"),
              type: 1,
            },
          };

          await Dispatch(this, GatewayDispatchCodes.UserSettingsProtoUpdate, body);
          await Dispatch(this, GatewayDispatchCodes.UserSettingsUpdate, discordSettings);

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

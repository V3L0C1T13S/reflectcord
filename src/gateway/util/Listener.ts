/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
import {
  APIChannel,
  APIUser,
  ApplicationFlagsBitField,
  GatewayCloseCodes,
  GatewayDispatchEvents,
  GatewayGuildCreateDispatchData,
  GatewayGuildDeleteDispatchData,
  GatewayGuildMemberAddDispatchData,
  GatewayGuildMemberRemoveDispatchData,
  GatewayGuildMemberUpdateDispatchData,
  GatewayGuildRoleDeleteDispatchData,
  GatewayGuildRoleUpdateDispatchData,
  GatewayIntentBits,
  GatewayInteractionCreateDispatchData,
  GatewayMessageCreateDispatchData,
  GatewayMessageDeleteBulkDispatchData,
  GatewayMessageDeleteDispatchData,
  GatewayMessageReactionAddDispatchData,
  GatewayMessageReactionRemoveDispatchData,
  GatewayMessageReactionRemoveEmojiDispatchData,
  GatewayTypingStartDispatchData,
  InteractionType,
} from "discord.js";
import { API } from "revolt.js";
import { APIWrapper, createAPI, systemUserID } from "@reflectcord/common/rvapi";
import {
  Channel,
  Emoji,
  Guild,
  HandleChannelsAndCategories,
  Member,
  selfUser,
  Status,
  User,
  toSnowflake,
  GuildCategory,
  SettingsKeys,
  RevoltSettings,
  UserSettings,
  settingsToProtoBuf,
  ReadState,
  Role,
  createCommonGatewayGuild,
  createUserPresence,
  interactionTitle,
  findComponentByIndex,
  convertDescriptorToComponent,
  multipleToSnowflake,
  GatewaySessionDTO,
  identifyClient,
  createUserGatewayGuild,
  MergedMemberDTO,
  GatewayPrivateChannelDTO,
  GatewayReactionPartialEmojiDTO,
  RelationshipType,
  GatewayRelationshipDTO,
  createInitialReadyGuild,
  filterMessageObject,
} from "@reflectcord/common/models";
import { Logger, genAnalyticsToken } from "@reflectcord/common/utils";
import {
  GatewayUserChannelUpdateOptional,
  IdentifySchema,
  GatewayUserSettingsProtoUpdateDispatchData,
  GatewayDispatchCodes,
  MergedMember,
  ReadyData,
  DefaultUserSettings,
  Session,
  IdentifyCapabilities,
  DefaultCapabilities,
  ReadySupplementalData,
  MergedPresences,
  APIPrivateChannel,
  GatewayLazyRequestDispatchData,
  LazyItem,
} from "@reflectcord/common/sparkle";
import { reflectcordWsURL } from "@reflectcord/common/constants";
import { VoiceState } from "@reflectcord/common/mongoose";
import { MemberContainer, emojiMap as reactionMap } from "@reflectcord/common/managers";
import { WebSocket } from "../Socket";
import { Dispatch } from "./send";
import experiments from "./experiments.json";
import { updateMessage } from "./messages";
import { createInternalListener } from "./InternalListener";
import { Intents } from "./Intents";

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
) {
  this.rvClient.on("packet", async (data) => {
    try {
      const { identifyPayload } = this;

      switch (data.type) {
        case "Error": {
          if (["InvalidSession", "AlreadyAuthenticated", "InvalidSession"].includes(data.error)) {
            this.close(GatewayCloseCodes.AuthenticationFailed);
          }
          this.close(GatewayCloseCodes.UnknownError);
          break;
        }
        // @ts-ignore
        case "NotFound": {
          this.close(GatewayCloseCodes.AuthenticationFailed);
          break;
        }
        case "Auth": {
          switch (data.event_type) {
            case "DeleteAllSessions": {
              if (this.rvSession?._id !== data.exclude_session_id) {
                this.close(GatewayCloseCodes.SessionTimedOut);
              }

              break;
            }
            case "DeleteSession": {
              if (this.rvSession?._id === data.session_id) {
                this.close(GatewayCloseCodes.SessionTimedOut);
              }

              break;
            }
            default:
          }
          break;
        }
        case "Ready": {
          const { trace } = this;

          if (identifyPayload.capabilities) {
            const capabilitiesObject = IdentifyCapabilities(identifyPayload.capabilities);
            this.capabilities = capabilitiesObject;
          } else {
            this.capabilities = DefaultCapabilities;
            Logger.warn("Client has no capabilities??");
          }

          trace.startTrace("get_user");

          const currentUser = data.users.find((x) => x.relationship === "User");
          if (!currentUser) return this.close(GatewayCloseCodes.AuthenticationFailed);

          trace.stopTrace("get_user");

          trace.startTrace("reflectcord_init");
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
          // @ts-ignore
          this.rvClient.api = this.rvAPI;
          // @ts-ignore
          this.rvAPIWrapper = new APIWrapper(this.rvAPI);

          this.user_id = await toSnowflake(currentUser._id);
          this.rv_user_id = currentUser._id;

          this.intentsManager = new Intents(this.intents ?? 0, this.version, this.bot);

          trace.stopTrace("reflectcord_init");

          trace.startTrace("get_users");
          const users = await Promise.all(data.users
            .map(async (user) => this.rvAPIWrapper.users.createObj({
              revolt: user,
              discord: await User.from_quark(user),
            })));

          const discordUsers = users.map((user) => user.discord);
          trace.stopTrace("get_users");

          trace.startTrace("get_channels");
          const channels = await Promise.all(data.channels
            .map(async (channel) => {
              const recipients: APIUser[] = [];
              if (channel.channel_type === "Group" || channel.channel_type === "DirectMessage") {
                channel.recipients.forEach((x) => {
                  if (x === this.rv_user_id) return;

                  const user = this.rvAPIWrapper.users.get(x);
                  if (user) recipients.push(user.discord);
                });
              }
              const params: any = { excludedUser: currentUser._id };
              if (recipients.length > 0) params.discordRecipients = recipients;

              const discordChannel = await Channel.from_quark(
                channel,
                params,
              );
              const channelObj = this.rvAPIWrapper.channels.createObj({
                revolt: channel,
                discord: discordChannel,
              });

              return channelObj;
            }));
          trace.stopTrace("get_channels");

          trace.startTrace("get_private_channels");
          const private_channels = channels
            .filter((x) => x.revolt.channel_type === "DirectMessage" || x.revolt.channel_type === "Group" || x.revolt.channel_type === "SavedMessages")
            .map((x) => x.discord) as APIPrivateChannel[];
          trace.stopTrace("get_private_channels");

          trace.startTrace("get_emojis");
          if (data.emojis) {
            await Promise.all(data.emojis
              .filter((x) => x.parent.type === "Server")
              .map(async (x) => this.rvAPIWrapper.emojis.createObj({
                revolt: x,
                discord: await Emoji.from_quark(x, {
                  discordUser: this.rvAPIWrapper.users.get(x.creator_id)?.discord,
                }),
              })));
          }
          trace.stopTrace("get_emojis");

          trace.startTrace("get_user_stage2");
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
          this.rvAPIWrapper.users.selfId = currentUser._id;

          trace.stopTrace("get_user_stage2");

          trace.startTrace("get_guilds");
          const lazyGuilds: GatewayGuildCreateDispatchData[] = [];

          const guilds = await Promise.all(data.servers
            .map(async (server) => {
              const rvChannels: API.Channel[] = server.channels
                .map((x) => this.rvAPIWrapper.channels.$get(x)?.revolt).filter((x) => x);

              const emojis = data.emojis
                ?.filter((emoji) => emoji.parent.type === "Server" && emoji.parent.id === server._id)
                .map((emoji) => this.rvAPIWrapper.emojis.get(emoji._id)!);

              const rvServer = this.rvAPIWrapper.servers.createObj({
                revolt: server,
                discord: await Guild.from_quark(server, {
                  discordEmojis: emojis?.map((emoji) => emoji.discord),
                }),
              });

              const discordGuild = rvServer.discord;

              const serverChannels = await HandleChannelsAndCategories(
                rvChannels,
                server.categories,
                server._id,
              );

              cacheServerCreateChannels.call(this, rvChannels, serverChannels);

              /**
               * Yes. Another caching hack. I really need to rewrite this... eventually.
               *
               * On the plus side: no more API abuse if we cache right here right now.
              * */
              const revoltMembers = data.members
                .filter((x) => x._id.server === rvServer.revolt._id);
              const members = (await Promise.all(revoltMembers.map(async (x) => {
                const rvMember = {
                  revolt: x,
                  discord: await Member.from_quark(x, {
                    discordUser: this.rvAPIWrapper.users.get(x._id.user)?.discord,
                  }),
                };

                return rvServer.extra?.members.createObj(rvMember);
              }))).filter((x): x is MemberContainer => !!x);

              const discordMembers = members.map((x) => x.discord);

              const member = await rvServer.extra?.members
                .fetch(rvServer.revolt._id, this.rv_user_id);

              if (currentUser.bot || !this.capabilities.ClientStateV2) {
                const commonGuild = createCommonGatewayGuild(discordGuild, {
                  channels: serverChannels,
                  members: discordMembers,
                  member: member?.discord ?? null,
                });

                const legacyGuild = {
                  ...discordGuild,
                  ...commonGuild,
                };

                if (!currentUser.bot) return legacyGuild;

                const botGuild = {
                  ...legacyGuild,
                  unavailable: false,
                };

                lazyGuilds.push(botGuild);
                return { id: discordGuild.id, unavailable: true };
              }

              const guild = await createUserGatewayGuild(discordGuild, {
                channels: serverChannels,
                members: discordMembers,
                member: member?.discord ?? null,
              });

              return guild;
            }));

          trace.stopTrace("get_guilds");

          trace.startTrace("get_sessions");
          const sessionStatus = await Status.from_quark(currentUser.status);
          const currentSession: Session = {
            activities: sessionStatus.activities ?? [],
            client_info: {
              version: 0,
              client: identifyClient(identifyPayload.properties?.browser ?? "Discord Client"),
            },
            status: identifyPayload?.presence?.status.toString() ?? sessionStatus.status ?? "offline",
            session_id: this.session_id,
          };
          if (identifyPayload.properties?.os) {
            currentSession.client_info.os = identifyPayload.properties?.os;
          }

          const sessions = [new GatewaySessionDTO(currentSession)];
          trace.stopTrace("get_sessions");

          trace.startTrace("get_members");
          const memberData = (await Promise.all(data.members.map(async (x) => {
            const server = this.rvAPIWrapper.servers.$get(x._id.server);
            const existing = server.extra?.members.get(x._id.user);
            if (existing) return { member: existing, guild: server.discord };

            const member = {
              revolt: x,
              discord: await Member.from_quark(x, {
                discordUser: this.rvAPIWrapper.users.get(x._id.user)?.discord,
              }),
            };

            server.extra?.members.createObj(member);

            return { member, guild: server.discord };
          })));
          trace.stopTrace("get_members");

          trace.startTrace("relationships");
          const relationships = await Promise.all(users
            .filter((u) => u.revolt.relationship !== "None" && u.revolt.relationship !== "User")
            .map(async (u) => ({
              discord: {
                type: await RelationshipType.from_quark(u.revolt.relationship ?? "Friend"),
                user: u.discord,
              },
              revolt: u.revolt,
            })));
          trace.stopTrace("relationships");

          trace.startTrace("get_presences");
          const friendPresences = await Promise.all(relationships
            .map((relationship) => createUserPresence({
              user: relationship.revolt,
              discordUser: relationship.discord.user,
              deduplicate: this.capabilities.DeduplicateUserObjects,
            })));
          const mergedPresences: MergedPresences = {
            // FIXME: this code sucks absolute balls
            guilds: await Promise.all(guilds.map((x) => {
              const guildMembers = memberData
                .filter(
                  (member) => x.id === member.guild.id
                  && member.member.revolt._id.user !== this.rv_user_id,
                );

              return Promise.all(guildMembers.map((member) => createUserPresence({
                user: this.rvAPIWrapper.users.$get(member.member.revolt._id.user).revolt,
                discordUser: member.member.discord.user!,
                deduplicate: this.capabilities.DeduplicateUserObjects,
              })));
            })),
            friends: friendPresences,
          };

          trace.stopTrace("get_presences");

          trace.startTrace("user_settings");
          const rvSettings = !currentUser.bot
            ? await this.rvAPIWrapper.users.fetchSettings()
              .catch(() => null) as unknown as RevoltSettings
            : null;

          const user_settings = rvSettings ? await UserSettings.from_quark(rvSettings, {
            status: sessionStatus.status?.toString() || null,
          }) : null;

          trace.stopAndStart("user_settings", "user_settings_proto");
          const user_settings_proto = rvSettings
            ? await settingsToProtoBuf(user_settings as any, {
              customStatusText: currentUser.status?.text,
            })
            : null;
          trace.stopTrace("user_settings_proto");

          trace.startTrace("serialized_read_states");

          const unreads = await this.rvAPIWrapper.messages.fetchUnreads();
          const readStateEntries = await Promise.all(unreads.map((x) => ReadState.from_quark(x)));

          trace.stopTrace("serialized_read_states");

          trace.startTrace("build_ready");
          const readyData: ReadyData = {
            v: this.version,
            users: discordUsers,
            user_settings_proto: user_settings_proto ? Buffer.from(user_settings_proto).toString("base64") : null,
            user_settings: user_settings ?? DefaultUserSettings,
            user: currentUserDiscord,
            guilds,
            guild_experiments: [],
            geo_ordered_rtc_regions: ["newark", "us-east"],
            relationships: relationships.map((x) => new GatewayRelationshipDTO(
              x.discord,
              this.capabilities.DeduplicateUserObjects,
            )),
            read_state: this.capabilities.VersionedReadStates ? {
              entries: readStateEntries,
              partial: false,
              version: 304128,
            } : readStateEntries,
            user_guild_settings: this.capabilities.VersionedUserGuildSettings ? {
              entries: user_settings?.user_guild_settings ?? [],
              partial: false,
              version: 642,
            } : user_settings?.user_guild_settings ?? [],
            experiments, // ily fosscord
            private_channels: this.capabilities.DeduplicateUserObjects
              ? private_channels.map((x) => new GatewayPrivateChannelDTO(x))
              : private_channels,
            resume_gateway_url: reflectcordWsURL,
            session_id: this.session_id,
            sessions,
            friend_suggestion_count: 0,
            guild_join_requests: [],
            connected_accounts: [],
            analytics_token: genAnalyticsToken(this.user_id),
            tutorial: null,
            session_type: "normal",
            api_code_version: 1,
            consents: {
              personalization: {
                consented: false, // never gonna fix this lol
              },
            },
            country_code: "US",
            // V6 & V7 garbo
            indicators_confirmed: [],
            _trace: [],
            auth_session_id_hash: "",
          };
          if (this.shard_id && this.shard_count) {
            readyData.shard = [this.shard_id, this.shard_count];
          }
          trace.stopTrace("build_ready");

          trace.startTrace("clean_ready");

          if (this.capabilities.UserSettingsProto) {
            // We opt to delete it here to avoid a race condition with Discord Mobile
            delete readyData.user_settings;
          }
          if (!this.capabilities.LazyUserNotes) {
            readyData.notes = {};
          }
          if (this.capabilities.DeduplicateUserObjects) {
            trace.startTrace("merged_members");
            const mergedMembers: MergedMember[][] = [];

            memberData.forEach((member_data) => {
              const { guild, member } = member_data;

              const guildIndex = guilds.findIndex((x) => x.id === guild.id);

              mergedMembers[guildIndex] ??= [];

              const mergedMember = new MergedMemberDTO(
                member.discord,
                member.discord.user!.id,
                {
                  guild_roles: guild.roles,
                },
              );

              mergedMembers[guildIndex]!.push(mergedMember);
            });
            trace.stopTrace("merged_members");

            readyData.merged_members = mergedMembers;
            if (!this.capabilities.PrioritizedReadyPayload) {
              readyData.merged_presences = mergedPresences;
            }
          } else {
            readyData.presences = friendPresences;
            // WORKAROUND: race condition on mobile
            delete readyData.users;
          }

          if (currentUserDiscord.bot) {
            readyData.application = {
              id: currentUserDiscord.id,
              flags: new ApplicationFlagsBitField().toJSON(),
            };
          }

          trace.stopTrace("clean_ready");

          if (identifyPayload.client_state?.initial_guild_id) {
            trace.startTrace("prepare_initial_guild");

            const guild = guilds
              .find((x) => x.id === identifyPayload.client_state?.initial_guild_id);

            if (guild && !("unavailable" in guild)) {
              readyData.guilds = readyData.guilds
                .filter((x: any) => x.id !== guild.id);

              await Dispatch(
                this,
                GatewayDispatchCodes.InitialGuild,
                await createInitialReadyGuild("properties" in guild ? guild.properties : guild, {
                  members: "members" in guild ? guild.members : [],
                  channels: guild.channels,
                }),
              );
            }

            trace.stopTrace("prepare_initial_guild");
          }

          readyData._trace.push(JSON.stringify(trace.toGatewayObject()));
          await Dispatch(this, GatewayDispatchEvents.Ready, readyData);

          trace.startTrace("start_internal_listener");
          await createInternalListener.call(this);
          trace.stopTrace("start_internal_listener");

          await Promise.all(lazyGuilds
            .map((x) => Dispatch(this, GatewayDispatchEvents.GuildCreate, x).catch(Logger.error)));

          if (!currentUserDiscord.bot && this.capabilities.PrioritizedReadyPayload) {
            const supplementalData: ReadySupplementalData = {
              merged_presences: mergedPresences,
              merged_members: [],
              lazy_private_channels: [],
              guilds: await Promise.all(guilds.map(async (x) => ({
                voice_states: (await VoiceState.find({ guild_id: x.id })),
                id: x.id,
                embedded_activities: [],
              }))),
              disclose: [],
            };

            await Dispatch(this, GatewayDispatchCodes.ReadySupplemental, supplementalData);
          }

          setImmediate(async () => {
            if (this.bot) return;

            Dispatch(this, GatewayDispatchCodes.SessionsReplace, sessions)
              .catch(Logger.error);
            Dispatch(this, GatewayDispatchEvents.PresenceUpdate, {
              user: currentUserDiscord,
              user_id: currentUserDiscord.id,
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
              last_message_id: msgObj.discord.id,
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

          if (this.intentsManager.hasMessagesIntent(channel.discord)) {
            await Dispatch(this, GatewayDispatchEvents.MessageCreate, filterMessageObject(
              body,
              {
                messageContent: this.intentsManager.hasIntent(GatewayIntentBits.MessageContent)
                || this.intentsManager.hasIntent(GatewayIntentBits.GuildMessages),
              },
              {
                user: this.user_id,
                channelType: channel.discord.type,
              },
            ));
          }

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
          const channel = await this.rvAPIWrapper.channels.fetch(data.channel_id);
          const message = await this.rvAPIWrapper.messages.fetch(data.channel_id, data.id);
          const interactionEmbed = message.revolt.embeds?.last();

          message.revolt.reactions?.[data.emoji_id]?.push(data.user_id);

          if (interactionEmbed?.type === "Text" && interactionEmbed.title === interactionTitle && interactionEmbed.description) {
            const revoltReactionNumber = reactionMap[data.emoji_id];

            if (revoltReactionNumber !== undefined) {
              const revoltComponent = findComponentByIndex(
                interactionEmbed.description,
                revoltReactionNumber,
              );
              if (revoltComponent) {
                const component = convertDescriptorToComponent(revoltComponent);

                const user = await this.rvAPIWrapper.users.fetch(data.user_id);
                const server = "server" in channel.revolt ? await this.rvAPIWrapper.servers.fetch(channel.revolt.server) : null;
                const interactionData: GatewayInteractionCreateDispatchData = {
                  id: message.discord.id,
                  application_id: this.user_id,
                  data: {
                    custom_id: component.custom_id,
                    component_type: component.type,
                  },
                  type: InteractionType.MessageComponent,
                  channel_id: channel.discord.id,
                  channel: {
                    id: channel.discord.id,
                    type: channel.discord.type,
                  },
                  token: message.discord.id,
                  version: 1,
                  message: message.discord,
                  locale: "en-US",
                  app_permissions: "0", // TODO (interactions): App permissions
                };

                if (server) {
                  const member = await server.extra!.members
                    .fetch(server.revolt._id, user.revolt._id);
                  interactionData.member = {
                    ...member.discord,
                    permissions: "0", // TODO (interactions) Member permissions
                    user: user.discord,
                  };
                  interactionData.guild_id = server.discord.id;
                } else interactionData.user = user.discord;

                await Dispatch(this, GatewayDispatchCodes.InteractionCreate, interactionData);
              }
            }
          }

          const body: GatewayMessageReactionAddDispatchData = {
            user_id: await toSnowflake(data.user_id),
            channel_id: message.discord.channel_id,
            message_id: message.discord.id,
            emoji: new GatewayReactionPartialEmojiDTO(emoji.discord),
          };

          if ("server" in channel.revolt && "guild_id" in channel.discord) {
            body.guild_id = channel.discord.guild_id;
            const server = await this.rvAPIWrapper.servers.fetch(channel.revolt.server);
            if (server.extra) {
              body.member = (await server.extra.members
                .fetch(server.revolt._id, data.user_id)).discord;
            }
          }

          await Dispatch(this, GatewayDispatchEvents.MessageReactionAdd, body);

          break;
        }
        case "MessageUnreact": {
          if (this.enable_lazy_channels && !this.lazy_channels[data.channel_id]) {
            return;
          }

          const emoji = await this.rvAPIWrapper.emojis.fetch(data.emoji_id);
          const channel = await this.rvAPIWrapper.channels.fetch(data.channel_id);
          const message = this.rvAPIWrapper.messages.get(data.id);

          message?.revolt.reactions?.[data.emoji_id]?.remove(data.user_id);

          const body: GatewayMessageReactionRemoveDispatchData = {
            user_id: await toSnowflake(data.user_id),
            channel_id: channel.discord.id,
            message_id: message?.discord.id ?? await toSnowflake(data.id),
            emoji: new GatewayReactionPartialEmojiDTO(emoji.discord),
          };

          if ("guild_id" in channel.discord) {
            body.guild_id = channel.discord.guild_id;
          }

          await Dispatch(this, GatewayDispatchEvents.MessageReactionRemove, body);

          break;
        }
        case "MessageRemoveReaction": {
          if (this.enable_lazy_channels && !this.lazy_channels[data.channel_id]) {
            return;
          }
          const emoji = await this.rvAPIWrapper.emojis.fetch(data.emoji_id);
          const channel = await this.rvAPIWrapper.channels.fetch(data.channel_id);
          const message = this.rvAPIWrapper.messages.get(data.id);

          delete message?.revolt.reactions?.[data.emoji_id];

          const body: GatewayMessageReactionRemoveEmojiDispatchData = {
            channel_id: channel.discord.id,
            message_id: message?.discord.id ?? await toSnowflake(data.id),
            emoji: new GatewayReactionPartialEmojiDTO(emoji.discord),
          };

          if ("guild_id" in channel.discord) {
            body.guild_id = channel.discord.guild_id;
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
            ids: await multipleToSnowflake(data.ids),
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

          if (!this.intentsManager.hasTypingIntent(channel.discord)) return;

          const body: GatewayTypingStartDispatchData = {
            channel_id: channel.discord.id,
            user_id: await toSnowflake(data.user),
            timestamp: Date.nowSeconds(),
          };

          if ("guild_id" in channel.discord && channel.discord.guild_id && "server" in channel.revolt) {
            if (!this.bot
              && this.capabilities.ClientStateV2
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
                omitted: false,
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
            ...await createUserGatewayGuild(guild.discord, {
              channels,
              members: member ? [member.discord] : [],
              member: member ? member.discord : null,
            }),
            members: member ? [member.discord] : [],
          };

          const botGuild = {
            ...commonGuild,
            ...guild.discord,
            unavailable: false,
          };

          await Dispatch(
            this,
            GatewayDispatchEvents.GuildCreate,
            this.capabilities.ClientStateV2 ? userGuild : botGuild,
          );

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
          const user = await this.rvAPIWrapper.users.fetch(data.user);

          const guildId = await toSnowflake(data.id);
          const body: GatewayGuildMemberAddDispatchData = {
            ...member.discord,
            guild_id: guildId,
          };

          if (this.intentsManager.hasIntent(GatewayIntentBits.GuildMembers)) {
            await Dispatch(this, GatewayDispatchEvents.GuildMemberAdd, body);
          }

          const memberList = this.subscribed_servers[data.id]?.memberList;
          if (memberList) {
            const ops = memberList.addItemToGroup("online", {
              member: {
                ...member.discord,
                presence: await createUserPresence({
                  user: user.revolt,
                  discordUser: user.discord,
                  minifyUser: true,
                }),
              },
            });
            if (!ops) return;

            const memberListBody: GatewayLazyRequestDispatchData = {
              ops,
              guild_id: guildId,
              groups: memberList.groups,
              id: memberList.id,
              member_count: memberList.memberCount,
              online_count: memberList.onlineCount,
            };

            await Dispatch(this, GatewayDispatchCodes.GuildMemberListUpdate, memberListBody);
          }

          break;
        }
        case "ServerMemberUpdate": {
          const server = this.rvAPIWrapper.servers.get(data.id.server);
          if (!server?.extra?.members) return;

          const member = await server.extra.members.fetch(data.id.server, data.id.user);
          const user = await this.rvAPIWrapper.users.fetch(data.id.user);
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

          const guildId = await toSnowflake(data.id.server);

          const body: GatewayGuildMemberUpdateDispatchData = {
            ...member.discord,
            user: member.discord.user ?? user.discord,
            guild_id: guildId,
          };

          await Dispatch(
            this,
            GatewayDispatchEvents.GuildMemberUpdate,
            body,
          );

          const memberList = this.subscribed_servers[data.id.server]?.memberList;

          if (memberList) {
            const memberIndex = memberList.findMemberItemIndex(member.discord.user!.id);
            if (!memberIndex) return;

            const updatedItem: LazyItem = {
              member: {
                ...member.discord,
                presence: await createUserPresence({
                  user: user.revolt,
                  discordUser: user.discord,
                  minifyUser: true,
                }),
              },
            };

            const ops = memberList.updateAndRecalculate(memberIndex, updatedItem);
            if (!ops) return;

            const memberListBody: GatewayLazyRequestDispatchData = {
              ops,
              guild_id: memberList.guildId,
              id: memberList.id,
              groups: memberList.groups,
              member_count: memberList.memberCount,
              online_count: memberList.onlineCount,
            };

            await Dispatch(this, GatewayDispatchCodes.GuildMemberListUpdate, memberListBody);
          }

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

          const subscribedServer = this.subscribed_servers[data.id];
          if (subscribedServer) {
            const { memberList } = subscribedServer;
            if (!memberList) return;

            const index = memberList.findMemberItemIndex(user.discord.id);
            if (index) {
              const ops = memberList.deleteAndRecalculate(index);
              const memberListUpdateBody: GatewayLazyRequestDispatchData = {
                ops,
                guild_id: memberList.guildId,
                groups: memberList.groups,
                id: memberList.id,
                member_count: memberList.memberCount,
                online_count: memberList.onlineCount,
              };

              await Dispatch(
                this,
                GatewayDispatchCodes.GuildMemberListUpdate,
                memberListUpdateBody,
              );
            }
          }

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

          if (data.data.status || data.data.online !== null || data.data.online !== undefined) {
            const updated = await createUserPresence({
              user: user.revolt,
              discordUser: user.discord,
            });

            if (
              data.id !== this.rv_user_id
              || this.bot
            ) {
              if (
                this.intentsManager.hasIntent(GatewayIntentBits.GuildPresences)
                || (this.bot && data.id === this.rv_user_id)
              ) {
                await Dispatch(this, GatewayDispatchEvents.PresenceUpdate, updated);
              }

              await Promise.all(Object.entries(this.subscribed_servers)
                .filter(([_, server]) => server.members?.includes(data.id))
                .map(async ([_, server]) => {
                  const { memberList } = server;
                  if (!memberList) return;

                  const index = memberList.findMemberItemIndex(user.discord.id);

                  const ops = memberList.updatePresence(index, {
                    ...updated,
                    user: { id: user.discord.id },
                  });
                  if (!ops) return;

                  const updatedList: GatewayLazyRequestDispatchData = {
                    ops,
                    groups: memberList.groups,
                    guild_id: memberList.guildId,
                    id: memberList.id,
                    member_count: memberList.memberCount,
                    online_count: memberList.onlineCount,
                  };

                  await Dispatch(this, GatewayDispatchCodes.GuildMemberListUpdate, updatedList);
                }));
            } else {
              // TODO: what is this mysterious "all" session for?
              await Dispatch(this, GatewayDispatchCodes.SessionsReplace, [{
                active: true,
                activities: updated.activities,
                client_info: {
                  client: "unknown",
                  os: "unknown",
                  version: 0,
                },
                session_id: "all",
                status: updated.status,
              }, {
                activities: updated.activities,
                client_info: {
                  client: identifyClient(identifyPayload.properties?.browser ?? "Discord Client"),
                  os: identifyPayload?.properties?.os ?? "linux",
                  version: 0,
                },
                session_id: this.session_id,
                status: updated.status,
              }]);
            }

            return;
          }

          await Dispatch(this, GatewayDispatchEvents.UserUpdate, user.discord);

          break;
        }
        case "UserPlatformWipe": {
          const user = this.rvAPIWrapper.users.get(data.user_id);
          if (!user) return;

          const updated: API.User = {
            ...user.revolt,
            username: "Removed User",
            online: false,
            relationship: "None",
            flags: data.flags,
          };

          const updatedDiscord = await User.from_quark(updated);

          if (user) {
            this.rvAPIWrapper.users.update(data.user_id, {
              revolt: updated,
              discord: updatedDiscord,
            }, [
              "Avatar",
              "ProfileBackground",
              "ProfileContent",
              "StatusText",
              "StatusPresence",
            ]);
          }

          const dmChannel = [...this.rvAPIWrapper.channels.values()]
            .find((x) => x.revolt.channel_type === "DirectMessage"
              && x.revolt.recipients.includes(user.revolt._id));

          if (dmChannel) {
            await Dispatch(this, GatewayDispatchEvents.ChannelDelete, dmChannel.discord);

            this.rvAPIWrapper.channels.delete(dmChannel.revolt._id);
          }

          if (user.revolt.relationship) {
            const relationshipBody = {
              id: user.discord.id,
              type: await RelationshipType.from_quark(user.revolt.relationship),
              nickname: user.discord.username,
              user,
            };

            await Dispatch(this, GatewayDispatchCodes.RelationshipRemove, relationshipBody);
          }

          await Dispatch(this, GatewayDispatchEvents.UserUpdate, user.discord);

          break;
        }
        case "UserPresence": {
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
          this.rvAPIWrapper.emojis.createObj({
            revolt: data,
            discord: await Emoji.from_quark(data),
          });

          if (data.parent.type !== "Server") return;

          const emojis = this.rvAPIWrapper.emojis.getServerEmojis(data.parent.id);

          if (this.intentsManager.hasIntent(GatewayIntentBits.GuildEmojisAndStickers)) {
            await Dispatch(this, GatewayDispatchEvents.GuildEmojisUpdate, {
              guild_id: await toSnowflake(data.parent.id),
              emojis: emojis.map((x) => x.discord),
            });
          }

          break;
        }
        case "EmojiDelete": {
          const emoji = this.rvAPIWrapper.emojis.get(data.id);

          if (emoji?.revolt.parent.type !== "Server") return;

          this.rvAPIWrapper.emojis.delete(data.id);

          const guildId = emoji.discord.id;
          const emojis = this.rvAPIWrapper.emojis
            .getServerEmojis(emoji.revolt.parent.id);

          if (this.intentsManager.hasIntent(GatewayIntentBits.GuildEmojisAndStickers)) {
            await Dispatch(this, GatewayDispatchEvents.GuildEmojisUpdate, {
              guild_id: guildId,
              emojis: emojis.map((x) => x.discord),
            });
          }

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
          const type = await RelationshipType.from_quark(data.status);
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
              type: data.update["frecency_user_settings"] ? 2 : 1,
            },
          };

          await Dispatch(this, GatewayDispatchCodes.UserSettingsProtoUpdate, body);
          if (!this.capabilities.UserSettingsProto) {
            await Dispatch(this, GatewayDispatchCodes.UserSettingsUpdate, discordSettings);
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
      // eslint-disable-next-line no-console
      console.error("Error during ws handle:", e);
    }
  });
}

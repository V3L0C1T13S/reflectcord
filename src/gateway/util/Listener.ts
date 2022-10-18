/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
import { GatewayCloseCodes, GatewayDispatchEvents, GatewayOpcodes } from "discord.js";
import { API, Channel as rvChannel } from "revolt.js";
import { createAPI } from "../../common/rvapi";
import {
  Channel, Guild, Member, Message, selfUser, User,
} from "../../common/models";
import { WebSocket } from "../Socket";
import { Send } from "./send";
import experiments from "./experiments.json";
import { toSnowflake } from "../../common/models/util";
import { UserRelationshipType } from "../../common/sparkle";

export async function startListener(this: WebSocket, token: string) {
  this.rvClient.on("packet", async (data) => {
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

        const users = await Promise.all(data.users
          .map((user) => User.from_quark(user)));
        const channels = await Promise.all(data.channels
          .filter((channel) => channel.channel_type === "DirectMessage")
          .map((channel) => Channel.from_quark(channel, currentUser._id)));
        const guilds = await Promise.all(data.servers
          .map(async (server) => {
            const rvChannels: API.Channel[] = server.channels
              .map((x) => {
                const ch = this.rvClient.channels.get(x)!;

                return {
                  _id: x,
                  name: ch?.name ?? "fixme",
                  description: ch?.description ?? "fixme",
                  channel_type: ch?.channel_type as any ?? "TextChannel",
                  server: ch?.server_id ?? "fixme",
                };
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
          .filter((u) => u.relationship === "Friend")
          .map((u) => User.from_quark(u)));

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
            id: x.id,
            type: UserRelationshipType.Friends,
            nickname: x.username,
            user: x,
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
          const channel = await this.rvClient.channels.get(data.channel);
          await Send(this, {
            op: GatewayOpcodes.Dispatch,
            t: GatewayDispatchEvents.MessageCreate,
            s: this.sequence++,
            d: {
              ...discordMsg,
              guild_id: channel?.server_id ? await toSnowflake(channel.server_id) : null,
            },
          });
        } else console.log("message is system message");

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
      case "ServerCreate": {
        await Send(this, {
          op: GatewayOpcodes.Dispatch,
          t: GatewayDispatchEvents.GuildCreate,
          s: this.sequence++,
          d: await Guild.from_quark(data.server),
        });
        break;
      }
      case "ChannelStopTyping": {
        // Discord wont handle this no matter what
        break;
      }
      default: {
        console.log(`Unknown event type ${data.type}`);
        break;
      }
    }
  });
}

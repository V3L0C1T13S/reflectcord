/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
import { GatewayDispatchEvents, GatewayOpcodes } from "discord.js";
import { API } from "revolt.js";
import {
  Application,
  Channel, Guild, Message, selfUser, User,
} from "../../common/models";
import { WebSocket } from "../Socket";
import { Send } from "./send";
import experiments from "./experiments.json";

export async function startListener(this: WebSocket) {
  this.rvClient.on("packet", async (data) => {
    switch (data.type) {
      case "Ready": {
        const users = await Promise.all(data.users
          .map((user) => User.from_quark(user)));
        const channels = await Promise.all(data.channels
          .map((channel) => Channel.from_quark(channel)));
        const guilds = await Promise.all(data.servers
          .map(async (server) => {
            const rvChannels = server.channels
              .map((x) => data.channels.find((ch) => x === ch._id))
              .filter((x) => x !== undefined) as API.Channel[];

            return {
              ...await Guild.from_quark(server),
              channels: await Promise.all(rvChannels.map((ch) => Channel.from_quark(ch))),
            };
          }));
        const currentUser = data.users.find((x) => x.relationship === "User")!;
        const currentUserDiscord = await selfUser.from_quark({
          user: currentUser,
          authInfo: {
            _id: currentUser._id,
            email: "fixme@gmail.com",
          },
        });

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
          guilds: [],
          guild_experiments: [],
          geo_ordered_rtc_regions: [],
          relationships: [],
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
          private_channels: [],
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
          merged_members: [],
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
        const discordMsg = await Message.from_quark(data);
        const channel = await this.rvClient.channels.get(data.channel);
        await Send(this, {
          op: GatewayOpcodes.Dispatch,
          t: GatewayDispatchEvents.MessageCreate,
          s: this.sequence++,
          d: {
            ...discordMsg,
            guild_id: channel?.server_id,
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
      default: {
        console.log(`Unknown event type ${data.type}`);
        break;
      }
    }
  });
}

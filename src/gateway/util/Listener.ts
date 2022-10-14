/* eslint-disable no-plusplus */
import { GatewayDispatchEvents, GatewayOpcodes } from "discord.js";
import { Channel, Guild, Message } from "../../common/models";
import { WebSocket } from "../Socket";
import { Send } from "./send";

export async function startListener(this: WebSocket) {
  this.rvClient.on("packet", async (data) => {
    switch (data.type) {
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

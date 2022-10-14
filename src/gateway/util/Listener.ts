/* eslint-disable no-plusplus */
import { GatewayDispatchEvents, GatewayOpcodes } from "discord.js";
import { WebSocket } from "../Socket";
import { Send } from "./send";

export async function startListener(this: WebSocket) {
  const rvWS = this.rvClient.websocket;

  this.rvClient.on("message", async () => {
    console.log("got a message");
    await Send(this, {
      op: GatewayOpcodes.Dispatch,
      t: GatewayDispatchEvents.MessageCreate,
      s: this.sequence++,
      d: {},
    });
  });

  rvWS.ws?.on("message", (data) => {

  });
}

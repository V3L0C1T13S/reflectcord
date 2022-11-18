import { GatewayCloseCodes } from "discord.js";
import { VoiceOPCodes } from "@reflectcord/common/sparkle";
import { Send, setHeartbeat, WebSocket } from "../util";

export async function onHeartbeat(this: WebSocket, data: any) {
  const nonce = data.d;

  setHeartbeat(this);
  if (Number.isNaN(nonce)) return this.close(GatewayCloseCodes.DecodeError);

  await Send(this, { op: VoiceOPCodes.HeartbeatAck, d: nonce });
}

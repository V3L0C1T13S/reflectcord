import { VoiceOPCodes } from "@reflectcord/common/sparkle";
import { Payload } from "@reflectcord/gateway/util";
import { getClients, Send, WebSocket } from "../util";

export async function onSpeaking(this: WebSocket, data: Payload) {
  if (!this.client) return;

  getClients(this.client.channel_id).forEach((client) => {
    if (client === this.client) return;
    const ssrc = this.client.out.tracks.get(client.websocket.user_id);

    Send(client.websocket, {
      op: VoiceOPCodes.Speaking,
      d: {
        user_id: client.websocket.user_id,
        speaking: data.d.speaking,
        ssrc: ssrc?.audio_ssrc || 0,
      },
    });
  });
}

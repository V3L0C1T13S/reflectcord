/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import { Payload } from "@reflectcord/gateway/util";
import { Logger } from "@reflectcord/common/utils";
import ws from "ws";
import { VoiceState } from "@reflectcord/common/mongoose";
import { GatewayCloseCodes } from "discord.js";
import { fromSnowflake } from "@reflectcord/common/models/util";
import { createAPI, APIWrapper } from "@reflectcord/common/rvapi";
import { Device, RTCRtpCodecParameters, useSdesMid } from "msc-node";
import { WebSocket } from "../../util";
import { connectTransport, onVortexMessage } from "./events/message";

export async function VortexIdentify(this: WebSocket, data: Payload) {
  clearTimeout(this.readyTimeout);
  Logger.log("Identifying...");
  const identify = data.d!;

  const {
    token, user_id, session_id, server_id, video, streams,
  } = identify;

  this.token = token;
  this.rvAPI = createAPI({
    token,
  });
  this.rvAPIWrapper = new APIWrapper(this.rvAPI);

  const user = await this.rvAPIWrapper.users.fetchSelf();
  this.user_id = user.discord.id;

  const voiceState = await VoiceState.findOne({ user_id: user.discord.id, session_id });
  if (!voiceState || !voiceState?.channel_id) return this.close(GatewayCloseCodes.UnknownError);

  this.vortex_channel_id = await fromSnowflake(voiceState.channel_id);

  this.sessionId = session_id;

  this.vortex_token = (await this.rvAPI.post(`/channels/${this.vortex_channel_id as ""}/join_call`)).token;

  this.vortex_device = {
    device: new Device({
      headerExtensions: {
        audio: [
          useSdesMid(),
        ],
      },
      codecs: {
        audio: [
          new RTCRtpCodecParameters({
            mimeType: "audio/opus",
            clockRate: 48000,
            // @ts-ignore
            preferredPayloadType: 100,
            channels: 2,
          }),
        ],
      },
    }),
  };
  this.on("ConnectTransport", (id, dtls) => connectTransport.call(this, id, dtls));

  this.vortex_ws = new ws.WebSocket("wss://vortex.revolt.chat");
  this.vortex_ws.on("open", () => {
    this.vortex_ws.send(JSON.stringify({
      id: this.vortex_sequence++,
      type: "Authenticate",
      data: {
        token: this.vortex_token,
        roomId: this.vortex_channel_id,
      },
    }));
  });
  this.vortex_ws.on("close", (e) => {
    if (e === 1000) return;
    Logger.warn(`Unexpected WS termination: ${e}`);
  });
  this.vortex_ws.on("message", (msg: Buffer) => {
    const d = JSON.parse(Buffer.from(msg).toString());
    onVortexMessage.call(this, d).catch(console.error);
  });
}

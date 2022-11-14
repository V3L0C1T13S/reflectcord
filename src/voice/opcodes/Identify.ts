/* eslint-disable camelcase */
import SemanticSDP from "semantic-sdp";
import { GatewayCloseCodes } from "discord.js";
import { Logger } from "../../common/utils";
import {
  endpoint, getClients, Send, WebSocket,
} from "../util";
import { VoiceOPCodes } from "../../common/sparkle";
import defaultsdp from "../util/sdp.json";
import { APIWrapper, createAPI } from "../../common/rvapi";
import { DbManager } from "../../common/db";
import { Payload } from "../../gateway/util";

// FIXME: Implement with RPC instead
const voiceStates = DbManager.client.db("reflectcord")
  .collection("voiceStates");

export async function onIdentify(this: WebSocket, data: Payload) {
  clearTimeout(this.readyTimeout);
  Logger.log("Identifying...");

  const identify = data.d!;

  const {
    token, user_id, session_id, server_id,
  } = identify;

  const voiceState = await voiceStates.findOne({ user_id, session_id });
  if (!voiceState) return this.close(GatewayCloseCodes.UnknownError);

  this.rvAPI = createAPI({
    token,
  });
  this.rvAPIWrapper = new APIWrapper(this.rvAPI);
  this.sessionId = session_id;
  this.token = token;
  this.user_id = user_id; // FIXME

  const sdp = SemanticSDP.SDPInfo.expand(defaultsdp);
  sdp.setDTLS(SemanticSDP.DTLSInfo.expand({ setup: "actpass", hash: "sha-256", fingerprint: endpoint.getDTLSFingerprint() }));

  this.client = {
    websocket: this,
    out: {
      tracks: new Map(),
    },
    in: {
      audio_ssrc: 0,
      video_ssrc: 0,
      rtx_ssrc: 0,
    },
    sdp,
    channel_id: voiceState.channel_id,
  };

  const clients = getClients(voiceState.channel_id)!;
  clients.add(this.client);

  this.on("close", () => {
    clients.delete(this.client);
  });

  await Send(this, {
    op: VoiceOPCodes.Ready,
    d: {
      streams: [],
      ssrc: -1,
      ip: "127.0.0.1",
      port: endpoint.getLocalPort(),
      modes: [
        "aead_aes256_gcm_rtpsize",
        "aead_aes256_gcm",
        "xsalsa20_poly1305_lite_rtpsize",
        "xsalsa20_poly1305_lite",
        "xsalsa20_poly1305_suffix",
        "xsalsa20_poly1305",
      ],
      heartbeat_interval: 1,
      experiments: [],
    },
  });
}

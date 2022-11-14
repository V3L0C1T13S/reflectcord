import MediaServer, { IncomingStream, OutgoingStream, Transport } from "medooze-media-server";
import SemanticSDP from "semantic-sdp";
import { Logger } from "../../common/utils";
import { WebSocket } from "./WebSocket";

export const PublicIP = process.env.PUBLIC_IP || "127.0.0.1";

try {
  const range = process.env.WEBRTC_PORT_RANGE || "4000";
  const ports = range.split("-");
  const min = Number(ports[0]);
  const max = Number(ports[1]);

  MediaServer.setPortRange(min, max);
} catch (error) {
  Logger.error("Invalid env var: WEBRTC_PORT_RANGE", process.env.WEBRTC_PORT_RANGE, error);
  process.exit(1);
}

export const endpoint = MediaServer.createEndpoint(PublicIP);

export interface Client {
  transport?: Transport;
  websocket: WebSocket;
  out: {
    stream?: OutgoingStream;
    tracks: Map<
      string,
      {
        audio_ssrc: number;
        video_ssrc: number;
        rtx_ssrc: number;
      }
    >;
  };
  in: {
    stream?: IncomingStream;
    audio_ssrc: number;
    video_ssrc: number;
    rtx_ssrc: number;
  };
  sdp: SemanticSDP.SDPInfo;
  channel_id: string;
}

export const channels = new Map<string, Set<Client>>();

export function getClients(channelId: string) {
  if (!channels.has(channelId)) channels.set(channelId, new Set());
  return channels.get(channelId)!;
}

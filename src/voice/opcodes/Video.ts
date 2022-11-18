/* eslint-disable camelcase */
import SemanticSDP from "semantic-sdp";
import { IncomingStreamTrack, SSRCs } from "medooze-media-server";
import { VoiceOPCodes } from "@reflectcord/common/sparkle";
import { Logger } from "@reflectcord/common/utils";
import { Send, WebSocket } from "../util";
import { channels, getClients } from "../util/MediaServer";

function attachTrack(this: WebSocket, track: IncomingStreamTrack, user_id: string) {
  if (!this.client) return;
  const outTrack = this.client.transport!.createOutgoingStreamTrack(track.getMedia());
  outTrack.attachTo(track);
  this.client.out.stream!.addTrack(outTrack);
  let ssrcs = this.client.out.tracks.get(user_id)!;
  if (!ssrcs) {
    ssrcs = this.client.out.tracks.set(user_id, {
      audio_ssrc: 0,
      rtx_ssrc: 0,
      video_ssrc: 0,
    }).get(user_id)!;
  }

  if (track.getMedia() === "audio") {
    ssrcs.audio_ssrc = outTrack.getSSRCs().media!;
  } else if (track.getMedia() === "video") {
    ssrcs.video_ssrc = outTrack.getSSRCs().media!;
    ssrcs.rtx_ssrc = outTrack.getSSRCs().rtx!;
  }

  Send(this, {
    op: VoiceOPCodes.Video,
    d: {
      user_id,
      ...ssrcs,
    },
  });
}

function handleSSRC(this: WebSocket, type: "audio" | "video", ssrcs: SSRCs) {
  const stream = this.client.in.stream!;
  const transport = this.client.transport!;

  const id = type + ssrcs.media;
  let track = stream.getTrack(id);
  if (!track) {
    Logger.log("createIncomingStreamTrack", id);
    track = transport.createIncomingStreamTrack(type, { id, ssrcs });
    stream.addTrack(track);

    const clients = getClients(this.client.channel_id)!;
    clients.forEach((client) => {
      if (client.websocket.user_id === this.user_id) return;
      if (!client.out.stream) return;

      attachTrack.call(this, track, client.websocket.user_id);
    });
  }
}

export async function onVideo(this: WebSocket, data: any) {
  if (!this.client) return;
  const { transport, channel_id } = this.client;
  if (!transport) return;

  const body = data.d;

  await Send(this, { op: VoiceOPCodes.MediaSinkWants, d: { any: 100 } });

  const id = `stream${this.user_id}`;

  let stream = this.client.in.stream!;
  if (!stream) {
    stream = this.client.transport!.createIncomingStream(
      // @ts-ignore
      SemanticSDP.StreamInfo.expand({
        id,
        tracks: [],
      }),
    );
    this.client.in.stream = stream;

    const interval = setInterval(() => {
      // eslint-disable-next-line no-restricted-syntax
      for (const track of stream.getTracks()) {
        // eslint-disable-next-line no-restricted-syntax
        for (const layer of Object.values(track.getStats())) {
          Logger.log(track.getId(), layer.total);
        }
      }
    }, 5000);

    stream.on("stopped", () => {
      Logger.log("stream stopped");
      clearInterval(interval);
    });
    this.on("close", () => {
      transport!.stop();
    });
    const out = transport.createOutgoingStream(
      SemanticSDP.StreamInfo.expand({
        id: `out${this.user_id}`,
        tracks: [],
      }),
    );
    this.client.out.stream = out;

    const clients = channels.get(channel_id)!;

    clients.forEach((client) => {
      if (client.websocket.user_id === this.user_id) return;
      if (!client.in.stream) return;

      client.in.stream?.getTracks().forEach((track) => {
        attachTrack.call(this, track, client.websocket.user_id);
      });
    });
  }

  if (body.audio_ssrc) {
    handleSSRC.call(this, "audio", { media: body.audio_ssrc, rtx: body.audio_ssrc + 1 });
  }
  if (body.video_ssrc && body.rtx_ssrc) {
    handleSSRC.call(this, "video", { media: body.video_ssrc, rtx: body.rtx_ssrc });
  }
}

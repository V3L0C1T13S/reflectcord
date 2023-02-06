/* eslint-disable no-restricted-syntax */
/*
  Fosscord: A FOSS re-implementation and extension of the Discord.com backend.
  Copyright (C) 2023 Fosscord and Fosscord Contributors

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published
  by the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/* eslint-disable camelcase */
import SemanticSDP from "semantic-sdp";
import {
  IncomingStream, IncomingStreamTrack, SSRCs, Transport,
} from "medooze-media-server";
import { VoiceOPCodes } from "@reflectcord/common/sparkle";
import { Logger } from "@reflectcord/common/utils";
import { Send, WebSocket } from "../../util";
import { channels, getClients } from "../../util/MediaServer";

function attachTrack(this: WebSocket, track: IncomingStreamTrack, user_id: string) {
  if (
    !this.client
    || !this.client.transport
    || !this.client.out.stream
  ) return;

  const outTrack = this.client.transport.createOutgoingStreamTrack(track.getMedia());
  outTrack.attachTo(track);

  this.client.out.stream.addTrack(outTrack);
  let ssrcs = this.client.out.tracks.get(user_id);
  if (!ssrcs) {
    ssrcs = this.client.out.tracks.set(user_id, {
      audio_ssrc: 0,
      rtx_ssrc: 0,
      video_ssrc: 0,
    }).get(user_id);
  }
  if (!ssrcs) return;

  if (track.getMedia() === "audio") {
    ssrcs.audio_ssrc = outTrack.getSSRCs().media || 0;
  } else if (track.getMedia() === "video") {
    ssrcs.video_ssrc = outTrack.getSSRCs().media || 0;
    ssrcs.rtx_ssrc = outTrack.getSSRCs().rtx || 0;
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
  if (!this.client) return;

  const stream = this.client.in.stream as IncomingStream;
  const transport = this.client.transport as Transport;

  const id = type + ssrcs.media;
  let track = stream.getTrack(id);
  if (!track) {
    Logger.log("createIncomingStreamTrack", id);
    track = transport.createIncomingStreamTrack(type, { id, ssrcs });
    stream.addTrack(track);

    const clients = getClients(this.client.channel_id);
    clients.forEach((client) => {
      if (client.websocket.user_id === this.user_id) return;
      if (!client.out.stream) return;

      attachTrack.call(this, track, client.websocket.user_id);
    });
  }
}

function createStream(
  this: WebSocket,
  transport: Transport,
  channel_id: string,
) {
  if (!this.client) return;
  if (!this.client.transport) return;

  const id = `stream${this.user_id}`;

  const stream = this.client.transport.createIncomingStream(
    SemanticSDP.StreamInfo.expand({
      id,
      tracks: [],
    }),
  );
  this.client.in.stream = stream;

  const interval = setInterval(() => {
    for (const track of stream.getTracks()) {
      for (const layer of Object.values(track.getStats())) {
        console.log(track.getId(), layer.total);
      }
    }
  }, 5000);

  stream.on("stopped", () => {
    console.log("stream stopped");
    clearInterval(interval);
  });
  this.on("close", () => {
    transport.stop();
  });
  const out = transport.createOutgoingStream(
    SemanticSDP.StreamInfo.expand({
      id: `out${this.user_id}`,
      tracks: [],
    }),
  );
  this.client.out.stream = out;

  const clients = channels.get(channel_id);
  if (!clients) return;

  clients.forEach((client) => {
    if (client.websocket.user_id === this.user_id) return;
    if (!client.in.stream) return;

    client.in.stream?.getTracks().forEach((track) => {
      attachTrack.call(this, track, client.websocket.user_id);
    });
  });
}

export async function onVideo(this: WebSocket, payload: any) {
  if (!this.client) return;
  const { transport, channel_id } = this.client;
  if (!transport) return;
  const { d } = payload;

  await Send(this, { op: VoiceOPCodes.MediaSinkWants, d: { any: 100 } });

  if (!this.client.in.stream) { createStream.call(this, transport, channel_id); }

  if (d.audio_ssrc) {
    handleSSRC.call(this, "audio", {
      media: d.audio_ssrc,
      rtx: d.audio_ssrc + 1,
    });
  }
  if (d.video_ssrc && d.rtx_ssrc) {
    handleSSRC.call(this, "video", {
      media: d.video_ssrc,
      rtx: d.rtx_ssrc,
    });
  }
}

export async function onVideoOld(this: WebSocket, data: any) {
  if (!this.client) return;
  if (!this.client.transport) return;

  const { transport, channel_id } = this.client;
  if (!transport) return;

  const body = data.d;

  await Send(this, { op: VoiceOPCodes.MediaSinkWants, d: { any: 100 } });

  const id = `stream${this.user_id}`;

  const stream = this.client.transport.createIncomingStream(
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
    transport.stop();
  });
  const out = transport.createOutgoingStream(
    SemanticSDP.StreamInfo.expand({
      id: `out${this.user_id}`,
      tracks: [],
    }),
  );
  this.client.out.stream = out;

  const clients = channels.get(channel_id);
  if (!clients) return;

  clients.forEach((client) => {
    if (client.websocket.user_id === this.user_id) return;
    if (!client.in.stream) return;

    client.in.stream?.getTracks().forEach((track) => {
      attachTrack.call(this, track, client.websocket.user_id);
    });
  });

  if (body.audio_ssrc) {
    handleSSRC.call(this, "audio", { media: body.audio_ssrc, rtx: body.audio_ssrc + 1 });
  }
  if (body.video_ssrc && body.rtx_ssrc) {
    handleSSRC.call(this, "video", { media: body.video_ssrc, rtx: body.rtx_ssrc });
  }
}

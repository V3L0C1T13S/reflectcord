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

import SemanticSDP from "semantic-sdp";
import { VoiceOPCodes } from "@reflectcord/common/sparkle";
import { Payload } from "@reflectcord/gateway/util";
import { PublicIP } from "@reflectcord/common/constants";
import {
  endpoint, Send, WebSocket,
} from "../../util";

export async function selectProtocol(this: WebSocket, payload: Payload) {
  if (!this.client) return;

  const data = payload.d;

  // eslint-disable-next-line prefer-template
  const offer = SemanticSDP.SDPInfo.parse("m=audio\n" + data.sdp);
  // @ts-ignore
  offer.getMedias()[0].type = "audio"; // this is bad, but answer.toString() fails otherwise
  this.client.sdp.setICE(offer.getICE());
  this.client.sdp.setDTLS(offer.getDTLS());

  const transport = endpoint.createTransport(this.client.sdp);
  this.client.transport = transport;
  transport.setRemoteProperties(this.client.sdp);
  transport.setLocalProperties(this.client.sdp);

  const dtls = transport.getLocalDTLSInfo();
  const ice = transport.getLocalICEInfo();
  const port = endpoint.getLocalPort();
  const fingerprint = `${dtls.getHash()} ${dtls.getFingerprint()}`;
  const candidates = transport.getLocalCandidates();
  const candidate = candidates[0];

  const answer = offer.answer({
    dtls,
    ice,
    candidates: endpoint.getLocalCandidates(),
    capabilities: {
      audio: {
        codecs: ["opus"],
        rtx: true,
        rtcpfbs: [{ id: "transport-cc" }],
        extensions: [
          "urn:ietf:params:rtp-hdrext:ssrc-audio-level",
          "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",
          "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",
          "urn:ietf:params:rtp-hdrext:sdes:mid",
        ],
      },
    },
  });

  // the Video handler creates streams but we need streams now so idk
  // eslint-disable-next-line no-restricted-syntax
  for (const offered of offer.getStreams().values()) {
    const incomingStream = transport.createIncomingStream(offered);
    const outgoingStream = transport.createOutgoingStream({
      audio: true,
    });
    outgoingStream.attachTo(incomingStream);
    this.client.in.stream = incomingStream;
    this.client.out.stream = outgoingStream;

    const info = outgoingStream.getStreamInfo();
    answer.addStream(info);
  }

  await Send(this, {
    op: VoiceOPCodes.SessionDescription,
    d: {
      video_codec: "H264",
      sdp: answer.toString(),
      media_session_id: this.sessionId,
      audio_codec: "opus",
    },
  });
}

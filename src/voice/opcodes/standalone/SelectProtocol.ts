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

  const offer = SemanticSDP.SDPInfo.parse(`m=audio\n${data.sdp}`);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
  const answer = `m=audio ${port} ICE/SDP\n`
    + `a=fingerprint:${fingerprint}\n`
    + `c=IN IP4 ${PublicIP}\n`
    + `a=rtcp:${port}\n`
    + `a=ice-ufrag:${ice.getUfrag()}\n`
    + `a=ice-pwd:${ice.getPwd()}\n`
    + `a=fingerprint:${fingerprint}\n`
    + `a=candidate:1 1 ${candidate!.getTransport()} ${candidate!.getFoundation()} ${candidate!.getAddress()} ${candidate!.getPort()} typ host\n`;
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

import SemanticSDP from "semantic-sdp";
import { VoiceOPCodes } from "@reflectcord/common/sparkle";
import { Payload } from "@reflectcord/gateway/util";
import { PublicIP } from "@reflectcord/common/constants";
import {
  endpoint, Send, WebSocket,
} from "../util";

export async function selectProtocol(this: WebSocket, payload: Payload) {
  const data = payload.d;

  const offer = SemanticSDP.SDPInfo.parse(`m=audio\n${data.sdp}`);
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

  const answer = `m=audio ${port} ICE/SDP
a=fingerprint:${fingerprint}
c=IN IP4 ${PublicIP}
a=rtcp:${port}
a=ice-ufrag:${ice.getUfrag()}
a=ice-pwd:${ice.getPwd()}
a=fingerprint:${fingerprint}
a=candidate:1 1 ${candidate?.getTransport()} ${candidate?.getFoundation()} ${candidate?.getAddress()} ${candidate?.getPort()} typ host
`;

  await Send(this, {
    op: VoiceOPCodes.SessionDescription,
    d: {
      video_codec: "H264",
      sdp: answer,
      media_session_id: this.sessionId,
      audio_codec: "opus",
    },
  });
}

/* eslint-disable no-plusplus */
import { RtpCapabilities, RtpParameters } from "msc-node/lib/RtpParameters";
import { DtlsParameters } from "msc-node/lib/Transport";
import SemanticSDP from "semantic-sdp";
import { toSnowflake } from "@reflectcord/common/models";
import { PublicIP } from "@reflectcord/common/constants";
import { VoiceOPCodes } from "@reflectcord/common/sparkle";
import { emitEvent } from "@reflectcord/common/Events";
import { fromSnowflake } from "@reflectcord/common/models/util";
import { GatewayDispatchEvents } from "discord.js";
import { UserContainer } from "@reflectcord/common/managers";
import { Consumer } from "msc-node/lib/Consumer";
import { Logger } from "@reflectcord/common/utils";
import { VortexPacketType } from "../types/vortex";
import { endpoint, Send, WebSocket } from "../../../util";
import defaultsdp from "../../../util/sdp.json";
import { updateVoiceState } from "../util";

export interface GenericBody {
  id: number,
  type: VortexPacketType,
  data?: any,
}

export interface InitializeTransportsBody extends GenericBody {
  type: "InitializeTransports",
}

export interface RoomInfoBody extends GenericBody {
  type: "RoomInfo",
  data: {
    users: Record<string, {
      audio: boolean,
    }>,
  }
}

export interface ConnectTransportBody extends GenericBody {
  type: "ConnectTransport",
  data: {
    dtlsParameters: DtlsParameters,
  }
}

export interface StartProduceBody extends GenericBody {
  type: "StartProduce",
}

export interface StopProduceBody extends GenericBody {
  type: "StopProduce",
}

export interface AuthenticateBody extends GenericBody {
  type: "Authenticate",
  data: {
    rtpCapabilities: RtpCapabilities,
  },
}

export interface UserStartProduceBody extends GenericBody {
  type: "UserStartProduce",
  data: {
    id: string,
    type: "audio",
  }
}

export interface UserStopProduceBody extends GenericBody {
  type: "UserStopProduce",
  data: {
    id: string,
    type: "audio",
  }
}

export interface StartConsumeBody extends GenericBody {
  type: "StartConsume",
  data: {
    id: string,
    producerId: string,
    kind: "audio",
    rtpParameters: RtpParameters,
  }
}

export type VortexDataPacket = InitializeTransportsBody
  | AuthenticateBody
  | ConnectTransportBody
  | StartProduceBody
  | StopProduceBody
  | UserStartProduceBody
  | UserStopProduceBody
  | StartConsumeBody
  | RoomInfoBody;

export function connectTransport(this: WebSocket, id: string, dtls: DtlsParameters) {
  return new Promise<ConnectTransportBody["data"]>((res, rej) => {
    const request = {
      id: ++this.vortex_sequence,
      type: "ConnectTransport",
      data: {
        id,
        dtlsParameters: dtls,
      },
    };
    this.vortex_ws.send(JSON.stringify(request));
    this.on("ConnectTransport", (d) => {
      if (d.id !== request.id) return;
      res(d.data);
    });
  });
}

/**
 * https://github.com/ShadowLp174/revoice.js/blob/dfc648403d4aa3d1c8da6d380dad31aa6555b43f/Signaling.js#L76
*/
export async function onVortexMessage(this: WebSocket, data: VortexDataPacket) {
  console.log(data);

  const consumers = new Map<string, { audio: Consumer }>();

  switch (data.type) {
    case "InitializeTransports": {
      this.vortex_ws.send(JSON.stringify({
        id: this.vortex_sequence++,
        type: "RoomInfo",
      }));
      break;
    }
    case "Authenticate": {
      this.vortex_device.device.load({ routerRtpCapabilities: data.data.rtpCapabilities });

      const req = {
        id: this.vortex_sequence++,
        type: "InitializeTransports",
        data: {
          mode: "SplitWebRTC",
          rtpCapabilities: data.data.rtpCapabilities,
        },
      };
      this.vortex_ws.send(JSON.stringify(req));

      const sdp = SemanticSDP.SDPInfo.expand(defaultsdp);
      sdp.setDTLS(SemanticSDP.DTLSInfo.expand({
        setup: "actpass",
        hash: "sha-256",
        fingerprint: endpoint.getDTLSFingerprint(),
      }));

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
        channel_id: await toSnowflake(this.vortex_channel_id),
      };

      const readyBody: any = {
        streams: [],
        ssrc: -1,
        ip: PublicIP,
        port: endpoint.getLocalPort(),
        modes: [
          "aead_aes256_gcm_rtpsize",
          "aead_aes256_gcm",
          "xsalsa20_poly1305_lite_rtpsize",
          "xsalsa20_poly1305_lite",
          "xsalsa20_poly1305_suffix",
          "xsalsa20_poly1305",
        ],
        experiments: [],
      };

      if (this.bot) readyBody.heartbeat_interval = 1;

      await Send(this, {
        op: VoiceOPCodes.Ready,
        d: readyBody,
      });

      break;
    }
    case "ConnectTransport": {
      this.emit("ConnectTransport", data.id, data.data.dtlsParameters);
      break;
    }
    case "RoomInfo": {
      const { users } = data.data;
      const channel = await this.rvAPIWrapper.channels.fetch(this.vortex_channel_id);
      const server = "server" in channel.revolt ? await this.rvAPIWrapper.servers.fetch(channel.revolt.server) : null;

      await Promise.all(Object.entries(users)
        .filter(([id]) => id !== this.rv_user_id)
        .map(([id, state]) => updateVoiceState.call(this, id, channel, state, server)));

      break;
    }
    case "StartProduce": {
      break;
    }
    case "UserStartProduce": {
      const channel = await this.rvAPIWrapper.channels.fetch(this.vortex_channel_id);
      const server = "server" in channel.revolt ? await this.rvAPIWrapper.servers.fetch(channel.revolt.server) : null;

      await updateVoiceState.call(this, data.data.id, channel, {
        audio: true,
      }, server);

      break;
    }
    case "UserStopProduce": {
      const channel = await this.rvAPIWrapper.channels.fetch(this.vortex_channel_id);
      const server = "server" in channel.revolt ? await this.rvAPIWrapper.servers.fetch(channel.revolt.server) : null;
      const consumer = consumers.get(data.data.id);

      switch (data.data.type) {
        case "audio": {
          if (consumer?.audio) {
            await Send(this, {
              op: VoiceOPCodes.Speaking,
              d: {
                user_id: await toSnowflake(data.data.id),
                speaking: false,
                ssrc: consumer.audio.id,
              },
            });
          }
          break;
        }
        default: {
          Logger.warn(`Unhandled type ${data.data.type}`);
          break;
        }
      }

      await updateVoiceState.call(this, data.data.id, channel, {
        audio: false,
      }, server);

      break;
    }
    default: {
      console.log(`unhandled type ${data.type}`);
    }
  }
}

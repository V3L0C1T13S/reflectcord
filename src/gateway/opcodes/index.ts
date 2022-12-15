import { WebSocket } from "../Socket";
import { Payload } from "../util";
import { onHeartbeat } from "./Heartbeat";
import { onIdentify } from "./Identify";
import { lazyReq } from "./lazyReq";
import { presenceUpdate } from "./PresenceUpdate";
import { RequestGuildMembers } from "./RequestGuildMembers";
import { onResume } from "./Resume";
import { VSUpdate } from "./VS";
import { GatewayOpcodes } from "../../common/sparkle";
import { QueryApplicationCommands } from "./QueryApplicationCommands";
import { HandleGuildSync } from "./GuildSync";
import { VSPing } from "./VSPing";
import { StreamCreate } from "./StreamCreate";
import { CallSync } from "./CallSync";

export type OPCodeHandler = (this: WebSocket, data: Payload) => any;

export const OPCodeHandlers: { [key: number ]: OPCodeHandler } = {
  [GatewayOpcodes.Heartbeat]: onHeartbeat,
  [GatewayOpcodes.Identify]: onIdentify,
  [GatewayOpcodes.PresenceUpdate]: presenceUpdate,
  [GatewayOpcodes.VoiceStateUpdate]: VSUpdate,
  [GatewayOpcodes.VoicePing]: VSPing,
  [GatewayOpcodes.Resume]: onResume,
  [GatewayOpcodes.RequestGuildMembers]: RequestGuildMembers,
  [GatewayOpcodes.GuildSync]: HandleGuildSync,
  [GatewayOpcodes.CallSync]: CallSync,
  [GatewayOpcodes.LazyRequest]: lazyReq,
  [GatewayOpcodes.StreamCreate]: StreamCreate,
  [GatewayOpcodes.QueryApplicationCommands]: QueryApplicationCommands,
};

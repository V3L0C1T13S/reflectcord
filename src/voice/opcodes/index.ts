import { WebSocket } from "../util";
import { VoiceOPCodes } from "../../common/sparkle/schemas/voice/opcodes";
import { onIdentify } from "./Identify";
import { onHeartbeat } from "./Heartbeat";
import { selectProtocol } from "./SelectProtocol";
import { HandleOp16 } from "./op16";
import { HandleOPCode12 } from "./op12";
import { onResume } from "./Resume";

export type OPCodeHandler = (this: WebSocket, data: any) => any;

export const voiceOPCodeHandlers: { [key: number ]: OPCodeHandler } = {
  [VoiceOPCodes.Identify]: onIdentify,
  [VoiceOPCodes.SelectProtocol]: selectProtocol,
  [VoiceOPCodes.Heartbeat]: onHeartbeat,
  [VoiceOPCodes.Resume]: onResume,
  12: HandleOPCode12,
  16: HandleOp16,
};

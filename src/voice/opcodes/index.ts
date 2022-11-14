import { WebSocket } from "../util";
import { VoiceOPCodes } from "../../common/sparkle";
import { onIdentify } from "./Identify";
import { onHeartbeat } from "./Heartbeat";
import { selectProtocol } from "./SelectProtocol";
import { VoiceBackendVersion } from "./VoiceBackendVersion";
import { onVideo } from "./Video";
import { onResume } from "./Resume";
import { onSpeaking } from "./Speaking";

export type OPCodeHandler = (this: WebSocket, data: any) => any;

export const voiceOPCodeHandlers: { [key: number ]: OPCodeHandler } = {
  [VoiceOPCodes.Identify]: onIdentify,
  [VoiceOPCodes.SelectProtocol]: selectProtocol,
  [VoiceOPCodes.Heartbeat]: onHeartbeat,
  [VoiceOPCodes.Speaking]: onSpeaking,
  [VoiceOPCodes.Resume]: onResume,
  [VoiceOPCodes.Video]: onVideo,
  [VoiceOPCodes.VoiceBackendVersion]: VoiceBackendVersion,
};

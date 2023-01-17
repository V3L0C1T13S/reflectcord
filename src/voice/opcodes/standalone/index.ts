import { VoiceOPCodes } from "@reflectcord/common/sparkle";
import { OPCodeList } from "..";
import { onHeartbeat } from "./Heartbeat";
import { onIdentify } from "./Identify";
import { onResume } from "./Resume";
import { selectProtocol } from "./SelectProtocol";
import { onSpeaking } from "./Speaking";
import { onVideo } from "./Video";
import { VoiceBackendVersion } from "./VoiceBackendVersion";

export const standaloneHandlers: OPCodeList = {
  [VoiceOPCodes.Identify]: onIdentify,
  [VoiceOPCodes.SelectProtocol]: selectProtocol,
  [VoiceOPCodes.Heartbeat]: onHeartbeat,
  [VoiceOPCodes.Speaking]: onSpeaking,
  [VoiceOPCodes.Resume]: onResume,
  [VoiceOPCodes.Video]: onVideo,
  [VoiceOPCodes.VoiceBackendVersion]: VoiceBackendVersion,
};

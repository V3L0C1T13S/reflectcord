import { VoiceOPCodes } from "@reflectcord/common/sparkle";
import { OPCodeList } from "..";
import { selectProtocol } from "../standalone/SelectProtocol";
import { VoiceBackendVersion } from "../standalone/VoiceBackendVersion";
import { VortexIdentify } from "./Identify";
import { onSpeakVortex } from "./Speak";

export const vortexHandlers: OPCodeList = {
  [VoiceOPCodes.Identify]: VortexIdentify,
  [VoiceOPCodes.SelectProtocol]: selectProtocol,
  [VoiceOPCodes.Speaking]: onSpeakVortex,
  [VoiceOPCodes.VoiceBackendVersion]: VoiceBackendVersion,
};

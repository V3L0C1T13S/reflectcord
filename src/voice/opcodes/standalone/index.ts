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

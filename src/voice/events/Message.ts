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

import { Logger } from "@reflectcord/common/utils";
import { VoiceOPCodes } from "@reflectcord/common/sparkle";
import { GatewayCloseCodes } from "discord.js";
import { VoiceBackends } from "../opcodes";
import { WebSocket } from "../util";

const backend = process.env["VOICE_BACKEND"] ?? "vortex";
const OPCodeBackend = VoiceBackends[backend];
if (!OPCodeBackend) throw new Error("Invalid OPCode backend.");

export async function onMessage(this: WebSocket, buffer: Buffer) {
  try {
    const data = JSON.parse(buffer.toString());
    Logger.log(`incoming message: ${buffer.toString()}`);
    if (data.op !== VoiceOPCodes.Identify && !this.user_id) {
      return this.close(GatewayCloseCodes.NotAuthenticated);
    }

    const OPCodeHandler = OPCodeBackend![data.op];
    if (!OPCodeHandler) {
      // FIXME: Close connection if all opcodes are implemented
      Logger.error(`Unknown opcode ${data.op} on backend ${backend}`);
      return;
    }

    return await OPCodeHandler.call(this, data);
  } catch (e) {
    Logger.error(`RTC: ${e}`);
  }
}

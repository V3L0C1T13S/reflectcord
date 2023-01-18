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
import { Payload } from "@reflectcord/gateway/util";
import { getClients, Send, WebSocket } from "../../util";

export async function onSpeaking(this: WebSocket, data: Payload) {
  if (!this.client) return;

  getClients(this.client.channel_id).forEach((client) => {
    if (client === this.client) return;
    const ssrc = this.client.out.tracks.get(client.websocket.user_id);

    Send(client.websocket, {
      op: VoiceOPCodes.Speaking,
      d: {
        user_id: client.websocket.user_id,
        speaking: data.d.speaking,
        ssrc: ssrc?.audio_ssrc || 0,
      },
    });
  });
}

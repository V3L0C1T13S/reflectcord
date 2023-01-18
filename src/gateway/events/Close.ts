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

import { RabbitMQ, Logger } from "@reflectcord/common/utils";
import { WebSocket } from "../Socket";

export async function Close(this: WebSocket, code: number, reason: string) {
  Logger.log(`WS Closed ${code} ${reason}`);
  if (this.heartbeatTimeout) clearTimeout(this.heartbeatTimeout);
  if (this.readyTimeout) clearTimeout(this.readyTimeout);
  this.deflate?.close();
  this.inflate?.close();
  this.removeAllListeners();

  if (this.typingConsumer) await RabbitMQ.channel?.cancel(this.typingConsumer.consumerTag);

  // Getting out of revolt
  this.rvClient.removeAllListeners();
  await this.rvClient.logout(true);
  Logger.log("Logged out of revolt");
}

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

import "missing-native-js-functions";
import http from "http";
import WS from "ws";
import { RabbitMQ } from "@reflectcord/common/utils";
import { initDb } from "@reflectcord/common/db";
import { onConnect } from "./events";

export class ReflectcordVoice {
  ws: WS.Server;
  port = 3015;
  server: http.Server;

  constructor() {
    this.server = http.createServer((req, res) => {
      res.writeHead(200).end("Online");
    });

    this.server.on("upgrade", (request, socket, head) => {
      if (!request.url?.includes("voice")) return;
      // eslint-disable-next-line @typescript-eslint/no-shadow
      this.ws.handleUpgrade(request, socket, head, (socket) => {
        // @ts-ignore
        // eslint-disable-next-line no-param-reassign
        socket.server = this;
        this.ws.emit("connection", socket, request);
      });
    });

    this.ws = new WS.Server({
      maxPayload: 1024 * 1024 * 100,
      noServer: true,
    });

    this.ws.on("connection", onConnect);
    // eslint-disable-next-line no-console
    this.ws.on("error", console.error);
  }

  async init() {
    await RabbitMQ.init();
    await this.start();
  }

  async start() {
    await initDb();
    if (!this.server.listening) {
      this.server.listen(this.port);
      // eslint-disable-next-line no-console
      console.log("VOICE ON!");
    }
  }

  async stop() {
    this.server.close();
  }
}

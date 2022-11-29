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

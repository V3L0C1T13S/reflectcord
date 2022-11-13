import http from "http";
import WS from "ws";
import { RabbitMQ } from "../common/utils/RabbitMQ";
import { onConnect } from "./events";

export class ReflectcordVoice {
  ws: WS.Server;
  port = 3015;
  server = http.createServer((req, res) => {
    res.writeHead(200).end("Online");
  });

  constructor() {
    this.server.on("upgrade", (request, socket, head) => {
      // eslint-disable-next-line no-shadow
      this.ws.handleUpgrade(request, socket, head, (socket) => {
        this.ws.emit("connection", socket, request);
      });
    });

    this.ws = new WS.Server({
      maxPayload: 4096,
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

import http from "http";
import WS from "ws";
import { RabbitMQ } from "../common/utils/RabbitMQ";

export class ReflectcordVoice {
  ws = new WS.Server({
    noServer: true,
  });
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

import ws from "ws";
import http from "http";
import { Connection } from "./events";

export class ReflectcordGateway {
  websocketServer: ws.Server;
  port = 3002;
  server: http.Server;

  constructor(server?: http.Server) {
    if (server) this.server = server;
    else {
      this.server = http.createServer((req, res) => {
        res.writeHead(200).end("Online");
      });
    }

    this.server.on("upgrade", (request, socket, head) => {
      // eslint-disable-next-line no-shadow
      this.websocketServer.handleUpgrade(request, socket, head, (socket) => {
        this.websocketServer.emit("connection", socket, request);
      });
    });

    this.websocketServer = new ws.Server({
      maxPayload: 4096,
      noServer: true,
    });
    this.websocketServer.on("connection", Connection);
    // eslint-disable-next-line no-console
    this.websocketServer.on("error", console.error);
  }

  async start() {
    if (!this.server.listening) {
      this.server.listen(this.port);
      // eslint-disable-next-line no-console
      console.log("Gateway ON");
    }
  }

  async stop() {
    this.server.close();
  }
}

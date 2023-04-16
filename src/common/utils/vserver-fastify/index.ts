import Fastify, { FastifyInstance } from "fastify";
import autoroutes from "fastify-autoroutes";

export class FastifyServer {
  app: FastifyInstance;
  port: number;
  host: string;

  constructor(app?: FastifyInstance, port = 3000, host = "localhost") {
    this.app = app ?? Fastify({
      ignoreTrailingSlash: true,
    });
    this.port = port;
    this.host = host;
  }

  async registerRoutesDirectory(dir: string) {
    await this.app.register(autoroutes, {
      dir,
    });
  }

  async start() {
    await this.app.listen({ port: this.port, host: this.host });
  }
}

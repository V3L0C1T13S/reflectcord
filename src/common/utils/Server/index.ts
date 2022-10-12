import express from "express";
import autoroutes from "express-automatic-routes";

export class Server {
  app = express();
  port: number;

  constructor(port = 3000) {
    this.port = port;
  }

  registerRoutesDirectory(dir: string) {
    autoroutes(this.app, {
      dir,
    });
  }

  async start() {
    this.app.listen(this.port);
  }
}

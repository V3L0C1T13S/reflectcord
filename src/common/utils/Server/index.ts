import express from "express";
import autoroutes from "express-automatic-routes";

export class Server {
  app: express.Express;
  port: number;

  constructor(app?: express.Express, port = 3000) {
    this.app = app ?? express();
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

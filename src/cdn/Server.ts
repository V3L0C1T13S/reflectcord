import bodyParser from "body-parser";
import path from "path";
import { Server, RabbitMQ } from "@reflectcord/common/utils";
import "express-async-errors";
import { initDb } from "@reflectcord/common/db";
import fileUpload from "express-fileupload";

export class ReflectcordCDN extends Server {
  port = 3001;

  async init() {
    await RabbitMQ.init();
    await this.start();
  }

  async start() {
    this.app.use((req, res, next) => {
      res.set("Access-Control-Allow-Origin", "*");
      // TODO: use better CSP policy
      res.set(
        "Content-security-policy",
        "default-src *  data: blob: filesystem: about: ws: wss: 'unsafe-inline' 'unsafe-eval'; script-src * data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src * data: blob: 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src * data: blob: ; style-src * data: blob: 'unsafe-inline'; font-src * data: blob: 'unsafe-inline';",
      );
      res.set("Access-Control-Allow-Headers", req.header("Access-Control-Request-Headers") || "*");
      res.set("Access-Control-Allow-Methods", req.header("Access-Control-Request-Methods") || "*");
      next();
    });
    this.app.use(bodyParser.json({ inflate: true, limit: "10mb" }));
    this.app.use(fileUpload());

    await initDb();

    this.registerRoutesDirectory(path.join(__dirname, "routes"));

    // eslint-disable-next-line no-console
    console.log("CDN ON!");
    super.start();
  }
}

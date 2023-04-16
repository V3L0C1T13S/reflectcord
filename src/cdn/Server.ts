import "missing-native-js-functions";
import bodyParser from "body-parser";
import path from "path";
import { RabbitMQ, FastifyServer } from "@reflectcord/common/utils";
import { initDb } from "@reflectcord/common/db";
import fileUpload from "express-fileupload";
import "express-async-errors";
import fastifyExpress from "@fastify/express";
import fastifyMultipart from "@fastify/multipart";
import { reflectcordCDNHost, reflectcordCDNPort } from "@reflectcord/common/constants";
import { ErrorHandler } from "../api/middleware/ErrorHandler";
import { upload } from "./upload";

export class ReflectcordCDN extends FastifyServer {
  constructor() {
    super(undefined, reflectcordCDNPort, reflectcordCDNHost);
  }

  async init() {
    await RabbitMQ.init();
    await this.start();
  }

  async start() {
    this.app.register(fastifyExpress).after(() => {
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
      this.app.use(ErrorHandler);
      this.app.use("/upload", upload);
    });

    await initDb();

    await this.app.register(fastifyMultipart);
    await this.registerRoutesDirectory(path.join(__dirname, "routes"));

    // eslint-disable-next-line no-console
    console.log("CDN ON!");
    super.start();
  }
}

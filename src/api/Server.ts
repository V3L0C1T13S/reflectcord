import {
  NextFunction, Router, Response, Request,
} from "express";
import { join } from "path";
import morgan from "morgan";
import fileUpload from "express-fileupload";
import { Server, RabbitMQ } from "@reflectcord/common/utils";
import { initDb } from "@reflectcord/common/db";
import { enableLogging } from "@reflectcord/common/constants";
import {
  Authentication, BodyParser, Client, CORS, ErrorHandler,
} from "./middleware";
import "express-async-errors";
import { reflectcordAPIPort } from "../common/constants/index";

export class ReflectcordAPI extends Server {
  constructor(...args: any) {
    super(undefined, reflectcordAPIPort);
  }

  async init() {
    await RabbitMQ.init();
    await this.start();
  }

  async start() {
    this.app.use(CORS);
    this.app.use(BodyParser({ inflate: true, limit: "10mb" }));

    await initDb();

    const { app } = this;
    const api = Router(); // @ts-ignore
    this.app = api;

    if (enableLogging) this.app.use(morgan("combined"));

    api.use(Authentication);
    api.use(fileUpload());

    this.registerRoutesDirectory(join(__dirname, "routes"));

    api.use("*", (error: any, req: Request, res: Response, next: NextFunction) => {
      if (error) return next(error);
      res.status(404).json({
        message: "404 endpoint not found",
        code: 0,
      });
      next();
    });

    this.app = app;

    this.app.use("/api/v6", api);
    this.app.use("/api/v7", api);
    this.app.use("/api/v8", api);
    this.app.use("/api/v9", api);
    this.app.use("/api/v10", api);
    this.app.use("/api", api);

    this.app.use(ErrorHandler);
    Client(this.app);

    // eslint-disable-next-line no-console
    console.log("API UP!");

    await super.start();
  }
}

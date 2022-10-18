import {
  NextFunction, Router, Response, Request,
} from "express";
import { join } from "path";
import morgan from "morgan";
import { Server } from "../common/utils/Server";
import {
  Authentication, BodyParser, Client, CORS, ErrorHandler,
} from "./middleware";
import "express-async-errors";
import { DbManager } from "../common/db";
import { enableLogging } from "../common/constants";

export class ReflectcordAPI extends Server {
  async start() {
    this.app.use(CORS);
    this.app.use(BodyParser({ inflate: true, limit: "10mb" }));

    await DbManager.client.connect();

    const { app } = this;
    const api = Router(); // @ts-ignore
    this.app = api;

    if (enableLogging) this.app.use(morgan("combined"));

    api.use(Authentication);

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

    await super.start();
  }
}

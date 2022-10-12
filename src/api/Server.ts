import {
  NextFunction, Router, Response, Request,
} from "express";
import { join } from "path";
import { Server } from "../common/utils/Server";
import { Authentication, ErrorHandler } from "./middleware";

export class ReflectcordAPI extends Server {
  async start() {
    const { app } = this;
    const api = Router(); // @ts-ignore
    this.app = api;

    api.use(Authentication);

    api.use("*", (error: any, req: Request, res: Response, next: NextFunction) => {
      if (error) return next(error);
      res.status(404).json({
        message: "404 endpoint not found",
        code: 0,
      });
      next();
    });

    this.registerRoutesDirectory(join(__dirname, "routes"));

    this.app = app;

    this.app.use("/api/v6", api);
    this.app.use("/api/v7", api);
    this.app.use("/api/v8", api);
    this.app.use("/api/v9", api);
    this.app.use("/api/v10", api);
    this.app.use("/api", api);

    this.app.use(ErrorHandler);

    await super.start();
  }
}

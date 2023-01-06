import { Router } from "express";
import morgan from "morgan";
import { join } from "path";
import { enableLogging } from "@reflectcord/common/constants";
import { Server } from "@reflectcord/common/utils";

export class ReflectcordEvil extends Server {
  port = 3014;

  async start() {
    const { app } = this;
    const api = Router(); // @ts-ignore
    this.app = api;

    if (enableLogging) this.app.use(morgan("combined"));

    this.registerRoutesDirectory(join(__dirname, "routes"));

    this.app = app;

    this.app.use("/api", api);

    await super.start();

    console.log("EVIL: ON!");
  }
}

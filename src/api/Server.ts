/*
  Fosscord: A FOSS re-implementation and extension of the Discord.com backend.
  Copyright (C) 2023 Fosscord and Fosscord Contributors

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published
  by the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import "missing-native-js-functions";
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
  Authentication, BodyParser, Client, CORS, ErrorHandler, Versioning,
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
    api.use(Versioning);
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

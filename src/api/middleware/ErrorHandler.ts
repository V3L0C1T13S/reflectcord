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

/* eslint-disable no-multi-assign */
import { NextFunction, Request, Response } from "express";
import {
  ApiError, HTTPError, FieldError, Logger,
} from "@reflectcord/common/utils";

const EntityNotFoundErrorRegex = /"(\w+)"/;

export function ErrorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
  if (!error) return next();

  try {
    let code = 400;
    let httpcode = code;
    let message = error?.toString();
    let errors;

    // eslint-disable-next-line no-multi-assign
    if (error instanceof HTTPError && error.code) code = httpcode = error.code;
    else if (error instanceof ApiError) {
      code = error.code;
      message = error.message;
      httpcode = error.httpStatus;
    } else if (error.name === "EntityNotFoundError") {
      message = `${error.message.match(EntityNotFoundErrorRegex)?.[1] || "Item"} could not be found`;
      code = httpcode = 404;
    } else if (error instanceof FieldError) {
      code = Number(error.code);
      message = error.message;
      errors = error.errors;
    } else {
      Logger.error(`[Error] ${code} ${req.url}\n`, errors || error, "\nbody:", req.body);

      code = httpcode = 500;
      // TODO: Make this better
      const err: any = error;
      if (err?.response) {
        const { data, headers, status } = err.response;

        const errCode = status;
        if (errCode === 429) {
          const retryAfter = Math.ceil(data.retry_after);
          res.set("X-RateLimit-Limit", `${headers["X-RateLimit-Limit"]}`)
            .set("X-RateLimit-Remaining", "0")
            .set("X-RateLimit-Reset-After", `${headers["X-RateLimit-Reset-After"]}`)
            .set("Retry-After", `${retryAfter}`)
            .set("X-RateLimit-Bucket", `${headers["X-RateLimit-Bucket"]}`);

          code = httpcode = errCode;

          return res.status(httpcode).json({ message, retry_after: retryAfter, global: null });
        }
      }
    }

    if (httpcode > 511) httpcode = 400;

    res.status(httpcode).json({ code, message, errors });
  } catch (e) {
    Logger.error("[Internal Server Error] 500", error);
    return res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
}

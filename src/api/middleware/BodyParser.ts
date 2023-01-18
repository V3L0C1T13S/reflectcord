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

import bodyParser, { OptionsJson } from "body-parser";
import { NextFunction, Request, Response } from "express";
import { HTTPError } from "@reflectcord/common/utils/HTTPError";

export function BodyParser(opts?: OptionsJson) {
  const jsonParser = bodyParser.json(opts);

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers["content-type"]) req.headers["content-type"] = "application/json";

    jsonParser(req, res, (err) => {
      if (err) {
        return next(new HTTPError("common:body.INVALID_BODY", 400));
      }
      next();
    });
  };
}

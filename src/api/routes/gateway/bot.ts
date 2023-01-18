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

import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";
import { reflectcordWsURL } from "@reflectcord/common/constants";
import { APIGatewayBotResponse } from "@reflectcord/common/sparkle";

export default (express: Application) => <Resource> {
  get: (req, res: Response<APIGatewayBotResponse>) => {
    res.json({
      url: reflectcordWsURL,
      shards: 1,
      session_start_limit: {
        total: 1000,
        remaining: 999,
        reset_after: 14400000,
        max_concurrency: 1,
      },
    });
  },
};

/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { Logger, UnimplementedError } from "@reflectcord/common/utils";

export default () => <Resource> {
  get: (req, res) => {
    const { guild_id } = req.params;
    const { query, limit } = req.query;
    Logger.log(query, limit);

    throw new UnimplementedError();
  },
};

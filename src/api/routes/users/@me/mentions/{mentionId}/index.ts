/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { fromSnowflake } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";

export default () => <Resource> {
  delete: async (req, res) => {
    const { mentionId } = req.params;
    if (!mentionId) throw new HTTPError("Invalid params");

    const revoltMention = await fromSnowflake(mentionId);

    res.sendStatus(200);
  },
};

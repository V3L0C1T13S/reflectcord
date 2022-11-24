import { Resource } from "express-automatic-routes";
import { HTTPError, Logger } from "@reflectcord/common/utils";

export default () => <Resource> {
  post: async (req, res) => {
    const { body } = req;

    Logger.log(body);

    res.sendStatus(204);
  },
};

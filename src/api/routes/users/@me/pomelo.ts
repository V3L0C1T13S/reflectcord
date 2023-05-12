import { Resource } from "express-automatic-routes";
import { PomeloUpdateBody } from "@reflectcord/common/sparkle";

export default () => <Resource> {
  post: async (req, res) => {
    const { username } = req.body as PomeloUpdateBody;

    const user = await res.rvAPIWrapper.users.fetchSelf();

    res.json(user.discord);
  },
};

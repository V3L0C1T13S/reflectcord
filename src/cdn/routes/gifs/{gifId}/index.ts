import { Resource } from "express-automatic-routes";
import fetch from "node-fetch";
import { gifBoxAPIUrl } from "../../../../common/constants";

export default () => <Resource> {
  get: async (req, res) => {
    const { gifId } = req.params;

    if (!gifId) return res.sendStatus(404);

    const gifData = await (await fetch(`${gifBoxAPIUrl}/file/posts/${gifId}`)).buffer();

    return res.json();
  },
};

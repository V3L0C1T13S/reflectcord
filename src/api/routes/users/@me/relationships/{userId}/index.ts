import { Resource } from "express-automatic-routes";
import { fromSnowflake } from "../../../../../../common/models/util";
import { HTTPError } from "../../../../../../common/utils";

export default () => <Resource> {
  put: async (req, res) => {
    const { userId } = req.params;

    if (!userId) throw new HTTPError("Invalid params");

    const rvUserId = await fromSnowflake(userId);

    await res.rvAPI.put(`/users/${rvUserId as ""}/friend`);

    res.sendStatus(204);
  },
};

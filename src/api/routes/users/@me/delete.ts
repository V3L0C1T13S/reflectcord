import { Resource } from "express-automatic-routes";
import { UnimplementedError } from "@reflectcord/common/utils";

export default () => <Resource> {
  // TODO (Strict mode): - Require password
  post: async (req, res) => {
    throw new UnimplementedError();

    /*
    await res.rvAPI.post("/auth/account/delete");

    res.sendStatus(204);
    */
  },
};

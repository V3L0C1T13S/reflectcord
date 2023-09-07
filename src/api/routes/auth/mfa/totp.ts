import { Resource } from "express-automatic-routes";
import { DataMFALogin, ResponseLogin } from "@reflectcord/common/models";
import { RevoltSession } from "@reflectcord/common/mongoose";

export default () => <Resource> {
  post: async (req, res) => {
    const loginResponse = await res.rvAPI.post("/auth/session/login", await DataMFALogin.to_quark(req.body));

    if (loginResponse.result === "Success") {
      await RevoltSession.create({
        _id: loginResponse._id,
        token: loginResponse.token,
        user_id: loginResponse.user_id,
        name: loginResponse.name,
        result: loginResponse.result,
      });
    }

    res.json(await ResponseLogin.from_quark(loginResponse));
  },
};

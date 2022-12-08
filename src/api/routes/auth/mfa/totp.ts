import { Resource } from "express-automatic-routes";
import { DataMFALogin, ResponseLogin } from "@reflectcord/common/models";

export default () => <Resource> {
  post: async (req, res) => {
    const loginResponse = await res.rvAPI.post("/auth/session/login", await DataMFALogin.to_quark(req.body));

    res.json(await ResponseLogin.from_quark(loginResponse));
  },
};

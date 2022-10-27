import { Resource } from "express-automatic-routes";
import { ResponseLogin } from "../../../../common/models";
import { HTTPError } from "../../../../common/utils";

export default () => <Resource> {
  post: async (req, res) => {
    const { code, ticket } = req.body;

    if (!code || !ticket) throw new HTTPError("Invalid params", 422);

    const loginResponse = await res.rvAPI.post("/auth/session/login", {
      mfa_response: {
        totp_code: code,
      },
      mfa_ticket: ticket,
    });

    res.json(await ResponseLogin.from_quark(loginResponse));
  },
};

import { Resource } from "express-automatic-routes";
import { HTTPError } from "../../../../common/utils";

export default () => <Resource> {
  post: async (req, res) => {
    const { code, ticket } = req.body;

    if (!code || !ticket) throw new HTTPError("Invalid params", 422);

    const loginRes = await res.rvAPI.put("/auth/mfa/ticket", {
      totp_code: code,
    });

    res.json({
      token: loginRes.token,
      user_settings: undefined,
    });
  },
};

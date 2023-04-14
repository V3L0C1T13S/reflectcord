/* eslint-disable camelcase */
import { Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { LoginSchema } from "@reflectcord/common/sparkle";
import { APILoginResponse, DataLogin, ResponseLogin } from "@reflectcord/common/models";
import { FieldErrors, HTTPError } from "@reflectcord/common/utils";
import { isAxiosError } from "axios";
import DeviceDetector from "device-detector-js";
import { RevoltSession } from "@reflectcord/common/mongoose";

export async function loginToRevolt(api: API.API, body: LoginSchema, name?: string) {
  const loginResponse = await api.post(
    "/auth/session/login",
    await DataLogin.to_quark(body, {
      friendly_name: name,
    }),
  );

  return loginResponse;
}

export default () => <Resource> {
  post: async (req: Request<{}, {}, LoginSchema>, res: Response<APILoginResponse>) => {
    const detector = new DeviceDetector();
    const device = detector.parse(req.headers["user-agent"] ?? "");
    const loginResponse = await loginToRevolt(res.rvAPI, req.body, `${device.client?.name} on ${device.os?.name}`).catch((err) => {
      if (isAxiosError(err)) {
        if (!err.response) throw new HTTPError("A bad error response was returned.", 500);
        switch (err.response.data.type) {
          case "InvalidCredentials": {
            throw FieldErrors({
              login: {
                message: "Invalid credentials.",
                code: "INVALID_LOGIN",
              },
            });
          }
          case "LockedOut": {
            throw FieldErrors({
              login: {
                message: "Your account has been temporarily locked out.",
                code: "INVALID_LOGIN",
              },
            });
          }
          default: {
            throw new HTTPError(`Unhandled error type ${err.response?.data.type}! Please report this!`, 500);
          }
        }
      }
      throw new HTTPError("Unknown login error! Please report this!", 500);
    });

    if (loginResponse.result === "Disabled") {
      throw FieldErrors({
        login: {
          message: "Your account has been disabled. Ask your administrator for further assistance",
          code: "INVALID_LOGIN",
        },
      });
    }

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

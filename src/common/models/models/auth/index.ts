import {
  ResponseLogin as RevoltLoginResponse,
  DataLogin as RevoltDataLogin,
} from "revolt-api";
import { QuarkConversion } from "../../QuarkConversion";

export type APILoginResponse = {
  token: string | null,
  settings: any,
  ticket?: string | undefined, // MFA ticket
  sms?: boolean | undefined,
  mfa?: boolean | undefined,
}

export type APILoginSchema = {
  /** Email, Phone number */
  login: string,
  password: string,
  captcha_key?: string,
}

export const ResponseLogin: QuarkConversion<RevoltLoginResponse, APILoginResponse> = {
  async to_quark(login) {
    const { token } = login;

    return {
      token: token ?? "",
      result: "Success",
      user_id: "", // FIXME,
      name: "",
      _id: "",
    };
  },

  async from_quark(login) {
    const isMFA = login.result === "MFA";

    return {
      token: !isMFA ? login.token : null,
      settings: undefined,
      ticket: isMFA ? login.ticket : undefined,
      sms: isMFA ? false : undefined,
      mfa: isMFA ? true : undefined,
    };
  },
};

export const DataLogin: QuarkConversion<RevoltDataLogin, APILoginSchema> = {
  async to_quark(data) {
    return {
      email: data.login,
      password: data.password,
      captcha: data.captcha_key ?? null,
    };
  },

  async from_quark(data: any) {
    const isMFA = data.mfa_ticket !== undefined;
    return {
      login: isMFA ? undefined : data.email,
      password: isMFA ? undefined : data.password,
      captcha_key: isMFA ? undefined : data.captcha,
    };
  },
};

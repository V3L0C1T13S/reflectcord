import { API } from "revolt-api";
import dotenv from "dotenv";

dotenv.config();

export const TestingToken = process.env["testToken"];

export function createAPI(token?: string) {
  return new API({
    authentication: {
      revolt: token ? {
        token,
      } : undefined,
    },
  });
}

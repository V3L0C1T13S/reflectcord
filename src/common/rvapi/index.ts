import { API, Options } from "revolt-api";
import dotenv from "dotenv";

dotenv.config();

export const TestingToken = process.env["testToken"];

export function createAPI(token?: Options["authentication"]["revolt"], bot?: boolean) {
  return new API({
    authentication: {
      revolt: token,
    },
  });
}

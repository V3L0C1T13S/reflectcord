import { API, Options } from "revolt-api";
import dotenv from "dotenv";
import { revoltApiURL } from "../constants";

dotenv.config();

export const TestingToken = process.env["testToken"];

export function createAPI(token?: Options["authentication"]["revolt"]) {
  return new API({
    baseURL: revoltApiURL,
    authentication: {
      revolt: token,
    },
  });
}

export * from "./images";
export * from "./APIWrapper";
export * from "./users";

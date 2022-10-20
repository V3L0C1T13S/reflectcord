import { API } from "revolt.js";
import { APIWrapper } from "../rvapi";

export class BaseManager {
  rvAPI: API.API;

  apiWrapper: APIWrapper;

  constructor(apiWrapper: APIWrapper) {
    this.rvAPI = apiWrapper.rvAPI;
    this.apiWrapper = apiWrapper;
  }
}

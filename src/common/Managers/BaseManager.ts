import { API } from "revolt.js";

export class BaseManager {
  rvApi: API.API;

  constructor(api: API.API) {
    this.rvApi = api;
  }
}

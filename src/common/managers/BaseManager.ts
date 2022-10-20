import { API } from "revolt.js";

export class BaseManager {
  rvAPI: API.API;

  constructor(api: API.API) {
    this.rvAPI = api;
  }
}

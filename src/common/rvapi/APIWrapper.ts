import { API } from "revolt.js";
import { MessageManager, UserManager } from "../managers";

export class APIWrapper {
  rvAPI: API.API;

  messages: MessageManager;

  users: UserManager;

  constructor(api: API.API) {
    this.rvAPI = api;

    this.messages = new MessageManager(this);
    this.users = new UserManager(this);
  }
}

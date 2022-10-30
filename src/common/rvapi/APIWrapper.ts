import { API } from "revolt.js";
import { ChannelsManager, MessageManager, UserManager } from "../managers";

export class APIWrapper {
  rvAPI: API.API;

  channels: ChannelsManager;

  messages: MessageManager;

  users: UserManager;

  constructor(api: API.API) {
    this.rvAPI = api;

    this.channels = new ChannelsManager(this);
    this.messages = new MessageManager(this);
    this.users = new UserManager(this);
  }
}

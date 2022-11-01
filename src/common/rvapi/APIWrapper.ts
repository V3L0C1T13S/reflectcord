import { API } from "revolt.js";
import {
  ChannelsManager, MessageManager, ServerManager, UserManager,
} from "../managers";

export class APIWrapper {
  rvAPI: API.API;

  channels: ChannelsManager;

  messages: MessageManager;

  users: UserManager;

  servers: ServerManager;

  constructor(api: API.API) {
    this.rvAPI = api;

    this.channels = new ChannelsManager(this);
    this.messages = new MessageManager(this);
    this.users = new UserManager(this);
    this.servers = new ServerManager(this);
  }
}

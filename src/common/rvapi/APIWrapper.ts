import { API } from "revolt.js";
import {
  ChannelsManager, MemberManager, MessageManager, ServerManager, UserManager, EmojiManager,
} from "../managers";

export class APIWrapper {
  rvAPI: API.API;

  channels: ChannelsManager;

  messages: MessageManager;

  users: UserManager;

  servers: ServerManager;

  members: MemberManager;

  emojis: EmojiManager;

  constructor(api: API.API) {
    this.rvAPI = api;

    this.channels = new ChannelsManager(this);
    this.messages = new MessageManager(this);
    this.users = new UserManager(this);
    this.servers = new ServerManager(this);
    this.members = new MemberManager(this);
    this.emojis = new EmojiManager(this);
  }
}

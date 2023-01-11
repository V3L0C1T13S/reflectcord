import { API } from "revolt.js";
import {
  ChannelsManager, MemberManager, MessageManager, ServerManager, UserManager, EmojiManager,
} from "../managers";

export class APIWrapper {
  bot: boolean;
  rvAPI: API.API;

  channels: ChannelsManager;

  messages: MessageManager;

  users: UserManager;

  servers: ServerManager;

  members: MemberManager;

  emojis: EmojiManager;

  constructor(api: API.API, options?: { bot?: boolean }) {
    this.rvAPI = api;

    this.bot = options?.bot ?? false;

    this.channels = new ChannelsManager(this);
    this.messages = new MessageManager(this);
    this.users = new UserManager(this);
    this.servers = new ServerManager(this);
    this.members = new MemberManager(this);
    this.emojis = new EmojiManager(this);
  }
}

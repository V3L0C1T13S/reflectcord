import { API } from "revolt-api";
import { rvAPIMode } from "../constants";
import {
  ChannelsManager, MemberManager, MessageManager, ServerManager, UserManager, EmojiManager,
} from "../managers";

export class APIWrapper {
  bot: boolean;
  rvAPI: API;

  channels: ChannelsManager;

  messages: MessageManager;

  users: UserManager;

  servers: ServerManager;

  members: MemberManager;

  emojis: EmojiManager;

  mode = rvAPIMode;

  token: string;

  constructor(api: API, options?: { bot?: boolean }) {
    this.rvAPI = api;

    this.bot = options?.bot ?? false;

    this.token = api.auth.headers?.["X-Session-Token"] as any ?? api.auth.headers?.["X-Bot-Token"] as any ?? "";

    this.channels = new ChannelsManager(this);
    this.messages = new MessageManager(this);
    this.users = new UserManager(this);
    this.servers = new ServerManager(this);
    this.members = new MemberManager(this);
    this.emojis = new EmojiManager(this);
  }
}

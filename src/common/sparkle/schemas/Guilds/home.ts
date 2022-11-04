import { APIMessage } from "discord.js";

export interface Item {
  message: APIMessage,
  thread: any,
  messages: APIMessage[],
}

export interface GuildFeedResults {
  items: Item[]
}

export interface GuildFeedResponse {
  results: GuildFeedResults;
}

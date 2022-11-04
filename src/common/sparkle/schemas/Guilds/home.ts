import { APIMessage } from "discord.js";

export interface Item {
  message?: {
    thread: string,
    message: APIMessage
  },
  thread?: any,
  messages?: {
    thread: string,
    message: APIMessage
  }[],
}

export interface GuildFeedResults {
  items: Item[]
}

export interface GuildFeedResponse {
  results: GuildFeedResults;
}

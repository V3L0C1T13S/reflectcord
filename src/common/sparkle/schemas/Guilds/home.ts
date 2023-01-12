import { APIMessage } from "discord.js";

export interface Item {
  id: string,
  message?: APIMessage,
  thread?: any,
  messages?: {
    thread: string,
    message: APIMessage
  }[],
  reference_messages: string[],
  seen: boolean,
  type: "message",
}

export interface GuildFeedResults {
  items: Item[]
}

export interface GuildFeedResponse {
  results: GuildFeedResults;
}

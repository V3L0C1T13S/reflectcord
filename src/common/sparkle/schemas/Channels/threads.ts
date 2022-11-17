import { RESTGetAPIGuildThreadsResult } from "discord.js";

export interface ThreadSearchResponse extends RESTGetAPIGuildThreadsResult {
  total_results: number,
  has_more: boolean,
}

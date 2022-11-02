import type { PostPopularResponse } from "gifbox.js/src/types/Responses";
import { GifboxClient } from "..";

export class Posts {
  client: GifboxClient;

  constructor(client: GifboxClient) {
    this.client = client;
  }

  async popularPosts(limit: number, skip: number) {
    const {
      data,
    } = await this.client.axios.get<PostPopularResponse>(`/post/popular?limit=${limit ?? 10}&skip=${skip ?? 0}`);
    return data;
  }
}

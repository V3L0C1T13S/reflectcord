import type { PostInfoResponse, PostPopularResponse, PostSearchResponse } from "gifbox.js/src/types/Responses";
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

  /** Fetch a post provided its ID. */
  async queryPost(id: string) {
    const { data } = await this.client.axios.get<PostInfoResponse>(`/post/info/${id}`);
    return data;
  }

  async search(query: string, limit: number, skip: number) {
    const encodedQuery = encodeURIComponent(query);
    const { data } = await this.client.axios.get<PostSearchResponse>(`/post/search?query=${encodedQuery}&limit=${limit}&skip=${skip}`);
    return data;
  }
}

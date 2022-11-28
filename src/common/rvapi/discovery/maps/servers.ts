import { DiscoveryClient } from "../client";
import { ServerDiscoveryResponse } from "../types";

export class Servers {
  client: DiscoveryClient;

  constructor(client: DiscoveryClient) {
    this.client = client;
  }

  async fetchPopular() {
    const res = await this.client.axios.get<ServerDiscoveryResponse>("/discover/servers.json");

    return res.data;
  }
}

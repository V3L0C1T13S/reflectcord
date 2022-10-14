import { Client } from "revolt.js";

/**
 * WS Client but it emits raw data with typings
 */
export class RawWebsocketClient {
  rvClient: Client;

  constructor(client: Client) {
    this.rvClient = client;
  }
}

import axios from "axios";
import { getRevoltDiscoveryDataURL } from "@reflectcord/common/constants";
import http from "http";
import { Servers } from "./maps/servers";

export class DiscoveryClient {
  axios = axios.create();

  servers = new Servers(this);

  async init() {
    this.axios = axios.create({
      baseURL: await getRevoltDiscoveryDataURL(),
      httpAgent: new http.Agent({ keepAlive: true }),
      timeout: 5000,
    });
  }
}

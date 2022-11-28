import axios from "axios";
import { getRevoltDiscoveryDataURL } from "@reflectcord/common/constants";
import { Servers } from "./maps/servers";

export class DiscoveryClient {
  axios = axios.create();

  servers = new Servers(this);

  async init() {
    this.axios = axios.create({
      baseURL: await getRevoltDiscoveryDataURL(),
    });
  }
}

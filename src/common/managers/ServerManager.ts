import { APIGuild } from "discord.js";
import { runInAction } from "mobx";
import { API } from "revolt.js";
import { Guild } from "../models";
import { BaseManager } from "./BaseManager";
import { QuarkContainer } from "./types";

export type ServerContainer = QuarkContainer<API.Server, APIGuild>;

export class ServerManager extends BaseManager<string, ServerContainer> {
  $get(id: string) {
    const server = this.get(id)!;

    return server;
  }

  createObj(data: ServerContainer) {
    if (this.has(data.revolt._id)) return this.$get(data.revolt._id);

    runInAction(() => {
      this.set(data.revolt._id, data);
    });

    return data;
  }

  async fetch(id: string) {
    if (this.has(id)) return this.$get(id);

    const res = await this.rvAPI.get(`/servers/${id as ""}`);

    return this.createObj({
      revolt: res,
      discord: await Guild.from_quark(res),
    });
  }

  /**
   * Leave or delete a server
  */
  async leave(id: string) {
    return this.rvAPI.delete(`/servers/${id as ""}`);
  }

  /**
   * Alias for leave
  */
  deleteServer(id: string) {
    return this.leave(id);
  }
}

import { APIGuild } from "discord.js";
import { runInAction } from "mobx";
import { API } from "revolt.js";
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
}

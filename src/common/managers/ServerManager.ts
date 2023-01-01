import { APIGuild } from "discord.js";
import { API } from "revolt.js";
import { isEqual } from "lodash";
import { Guild } from "../models";
import { BaseManager } from "./BaseManager";
import { QuarkContainer } from "./types";
import { MemberContainer, MemberManager } from "./MemberManager";

export type ServerContainer = QuarkContainer<API.Server, APIGuild, {
  members: MemberManager,
}>;

export type serverI = QuarkContainer<Partial<API.Server>, Partial<APIGuild>>;

export class ServerManager extends BaseManager<string, ServerContainer> {
  $get(id: string, data?: serverI) {
    if (data) this.update(id, data);
    const server = this.get(id)!;
    return server;
  }

  createObj(data: ServerContainer) {
    if (this.has(data.revolt._id)) return this.$get(data.revolt._id);

    if (!data.extra?.members) {
      // eslint-disable-next-line no-param-reassign
      data.extra = {
        members: new MemberManager(this.apiWrapper),
      };
    }
    this.set(data.revolt._id, data);

    return data;
  }

  async fetch(id: string) {
    if (this.has(id)) return this.$get(id);

    const res = await this.fetchRaw(id);

    return this.createObj({
      revolt: res,
      discord: await Guild.from_quark(res),
    });
  }

  /**
   * Fetch server without caching or conversion
  */
  fetchRaw(id: string) {
    return this.rvAPI.get(`/servers/${id as ""}`);
  }

  /**
   * Leave or delete a server
  */
  async leave(id: string, silent?: boolean) {
    return this.rvAPI.delete(`/servers/${id as ""}`, {
      leave_silently: silent,
    });
  }

  async removeServer(id: string, silent?: boolean, avoidReq?: boolean) {
    if (!avoidReq) {
      await this.leave(id, silent);
    }

    this.delete(id);
  }

  editRole(server: string, role: string, body: API.DataEditRole) {
    return this.rvAPI.patch(`/servers/${server as ""}/roles/${role as ""}`, body);
  }

  editRolePerms(server: string, role: string, body: API.DataSetServerRolePermission) {
    return this.rvAPI.put(`/servers/${server as ""}/permissions/${role as ""}`, body);
  }

  /**
   * Alias for leave
  */
  deleteServer(id: string) {
    return this.leave(id);
  }

  update(id: string, data: serverI) {
    const server = this.get(id)!;
    const apply = (ctx: string, key: string, target?: string) => {
      if (
        // @ts-expect-error TODO: clean up types here
        typeof data[ctx][key] !== "undefined"
            // @ts-expect-error TODO: clean up types here
            && !isEqual(server[ctx][target ?? key], data[ctx][key])
      ) {
        // @ts-expect-error TODO: clean up types here
        server[ctx][target ?? key] = data[ctx][key];
      }
    };
    const applyRevolt = (key: string, target?: string) => apply("revolt", key, target);
    const applyDiscord = (key: string, target?: string) => apply("discord", key, target);

    applyRevolt("owner");
    applyRevolt("name");
    applyRevolt("description");
    applyRevolt("categories", "channel_ids");
    applyRevolt("system_messages");
    applyRevolt("roles");
    applyRevolt("default_permissions");
    applyRevolt("icon");
    applyRevolt("banner");
    applyRevolt("nsfw");
    applyRevolt("flags");

    applyDiscord("owner_id");
    applyDiscord("name");
    applyDiscord("description");
    applyDiscord("roles");
    applyDiscord("icon");
    applyDiscord("icon_hash");
    applyDiscord("banner");
    applyDiscord("nsfw");
    applyDiscord("flags");
    applyDiscord("discovery_splash");
  }
}

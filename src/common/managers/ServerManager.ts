import { APIGuild } from "discord.js";
import { API } from "revolt.js";
import { isEqual } from "lodash";
import { Logger } from "../utils";
import { DbManager } from "../db";
import {
  Guild, RevoltOrderingSetting,
} from "../models";
import { BaseManager } from "./BaseManager";
import { QuarkContainer } from "./types";
import { MemberManager } from "./MemberManager";
import { ChannelContainer } from "./Channels";
import { getEmojilibEmojis } from "../emojilib";

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

  private async mongoGetServers() {
    const user = await this.apiWrapper.users.fetchSelf();

    const members = await DbManager.revoltMembers
      .find({ _id: { user: user.revolt._id } }).toArray();
    const servers = (await Promise.all(members
      .map((x) => DbManager.revoltServers.findOne({ _id: x._id.server }))))
      .filter((x): x is API.Server => !!x);

    return Promise.all(servers.map(async (x) => this.createObj({
      revolt: x,
      discord: await Guild.from_quark(x),
    })));
  }

  async getServers() {
    switch (this.apiWrapper.mode) {
      case "mongo": {
        return this.mongoGetServers();
      }
      default: {
        // FIXME: Worst possible way to get it unless we have WS access (which we dont)
        const rvSettings = await this.apiWrapper.users.fetchSettings();

        const ordering: RevoltOrderingSetting = JSON.parse(rvSettings.ordering?.[1] ?? "{}");

        const servers = ordering.servers
          ? (await Promise.all(ordering.servers
            .map((x) => this.apiWrapper.servers.fetch(x).catch(Logger.error))))
            .filter((x): x is ServerContainer => !!x) : [];

        return servers;
      }
    }
  }

  async inviteBot(server: string, bot: string) {
    return this.rvAPI.post(`/bots/${bot as ""}/invite`, {
      server,
    });
  }

  protected async getMember(serverId: string, memberId: string) {
    // TODO: Better caching
    const server = this.get(serverId);
    const member = server?.extra
      ? (await server.extra.members.fetch(serverId, memberId)).revolt
      : await this.rvAPI.get(`/servers/${serverId as ""}/members/${memberId as ""}`);

    return member;
  }

  /**
   * Add an array of roles to a member
   * @returns The updated member
  */
  async addRolesToMember(serverId: string, memberId: string, roles: string[]) {
    const member = await this.getMember(serverId, memberId);

    const res = await this.rvAPI.patch(`/servers/${serverId as ""}/members/${memberId as ""}`, {
      roles: [...member.roles ?? [], ...roles],
    });

    return res;
  }

  /**
   * Add a single role to a member
   * @returns The updated member
  */
  addRoleToMember(serverId: string, memberId: string, role: string) {
    return this.addRolesToMember(serverId, memberId, [role]);
  }

  async removeRolesFromMember(serverId: string, memberId: string, roles: string[]) {
    const member = await this.getMember(serverId, memberId);

    const res = await this.rvAPI.patch(`/servers/${serverId as ""}/members/${memberId as ""}`, {
      roles: (member.roles ?? []).filter((id) => !roles.includes(id)),
    });

    return res;
  }

  async removeRoleFromMember(serverId: string, memberId: string, role: string) {
    return this.removeRolesFromMember(serverId, memberId, [role]);
  }

  getInvite(id: string) {
    return this.rvAPI.get(`/invites/${id as ""}`);
  }

  getInvites(server: string) {
    return this.rvAPI.get(`/servers/${server as ""}/invites`);
  }

  async getChannelNameEmojis(id: string, mode: "name" | "id" = "id") {
    const server = await this.fetch(id);
    const channels = (await Promise.all(server.revolt.channels
      .map((x) => this.apiWrapper.channels.fetch(x).catch(() => {}))))
      .filter((x): x is ChannelContainer => !!x);

    const channelEmojis: Record<string, string> = {};

    channels.forEach((x) => {
      const keywords = x.discord.name!.split("-");
      const emojis = keywords.map((word) => getEmojilibEmojis(word)).flat();
      channelEmojis[mode === "id" ? x.discord.id : x.discord.name!] = emojis[0] ?? "❓";
    });

    return channelEmojis;
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
    applyRevolt("categories");
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
    applyDiscord("nsfw_level");
    applyDiscord("flags");
    applyDiscord("discovery_splash");
    applyDiscord("system_channel_id");
    applyDiscord("system_channel_flags");
    applyDiscord("rules_channel_id");
    applyDiscord("afk_channel_id");
    applyDiscord("public_updates_channel_id");
    applyDiscord("afk_timeout");
    applyDiscord("verification_level");
    applyDiscord("vanity_url_code");
  }
}

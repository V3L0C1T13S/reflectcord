import { APIGuildMember } from "discord.js";
import { runInAction } from "mobx";
import { API } from "revolt.js";
import { Member } from "@reflectcord/common/models";
import { Logger } from "@reflectcord/common/utils";
import { BaseManager } from "./BaseManager";
import { QuarkContainer } from "./types";

export type MemberContainer = QuarkContainer<API.Member, APIGuildMember>;

export class MemberManager extends BaseManager<string, MemberContainer> {
  $get(id: string) {
    const data = this.get(id)!;

    return data;
  }

  createObj(data: MemberContainer) {
    if (this.has(data.revolt._id.user)) return this.$get(data.revolt._id.user);

    Logger.log(`Adding new member ${data.revolt._id.user} to cache`);

    runInAction(() => {
      this.set(data.revolt._id.user, data);
    });

    return data;
  }

  async fetch(serverId: string, memberId: string) {
    if (this.has(memberId)) return this.$get(memberId);

    Logger.log(`fetching new user ${memberId} in server ${serverId}`);

    const res = await this.rvAPI.get(`/servers/${serverId as ""}/members/${memberId as ""}`);
    const user = await this.apiWrapper.users.fetch(memberId);

    return this.createObj({
      revolt: res,
      discord: await Member.from_quark(res, user.revolt),
    });
  }

  async fetchMembers(serverId: string, excludeOffline = true) {
    const members = await this.rvAPI.get(`/servers/${serverId as ""}/members`, {
      exclude_offline: excludeOffline,
    });

    return members;
  }
}

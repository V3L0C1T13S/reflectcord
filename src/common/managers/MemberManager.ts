import { APIGuildMember } from "discord.js";
import { runInAction } from "mobx";
import { API } from "revolt.js";
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

    runInAction(() => {
      this.set(data.revolt._id.user, data);
    });

    return data;
  }
}

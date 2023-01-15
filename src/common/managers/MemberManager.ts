import { APIGuildMember } from "discord.js";
import { API } from "revolt.js";
import { Member, User } from "@reflectcord/common/models";
import { Logger } from "@reflectcord/common/utils";
import { isEqual } from "lodash";
import { BaseManager } from "./BaseManager";
import { QuarkContainer } from "./types";

export type MemberContainer = QuarkContainer<API.Member, APIGuildMember>;
export type MemberI = QuarkContainer<Partial<API.Member>, Partial<APIGuildMember>>;

export class MemberManager extends BaseManager<string, MemberContainer> {
  fullyCached: string[] = [];

  $get(id: string, data?: MemberI) {
    if (data) this.update(id, data);
    const member = this.get(id)!;

    return member;
  }

  createObj(data: MemberContainer) {
    if (this.has(data.revolt._id.user)) return this.$get(data.revolt._id.user);

    // Logger.log(`Adding new member ${data.revolt._id.user} to cache`);

    this.set(data.revolt._id.user, data);

    return data;
  }

  update(id: string, data: MemberI) {
    const member = this.get(id)!;
    const apply = (ctx: string, key: string, target?: string) => {
      if (
        // @ts-expect-error TODO: clean up types here
        typeof data[ctx][key] !== "undefined"
            // @ts-expect-error TODO: clean up types here
            && !isEqual(member[ctx][target ?? key], data[ctx][key])
      ) {
        // @ts-expect-error TODO: clean up types here
        member[ctx][target ?? key] = data[ctx][key];
      }
    };
    const applyRevolt = (key: string, target?: string) => apply("revolt", key, target);
    const applyDiscord = (key: string, target?: string) => apply("discord", key, target);

    applyRevolt("joined_at");
    applyRevolt("nickname");
    applyRevolt("timeout");
    applyRevolt("roles");

    applyDiscord("joined_at");
    applyDiscord("communication_disabled_until");
    applyDiscord("roles");
    applyDiscord("deaf");
    applyDiscord("mute");
    applyDiscord("nick");
    applyDiscord("avatar");
    // TODO (tests)
    // applyDiscord("user");
  }

  async fetch(serverId: string, memberId: string) {
    if (this.has(memberId)) return this.$get(memberId);

    Logger.log(`fetching new user ${memberId} in server ${serverId}`);

    const res = await this.rvAPI.get(`/servers/${serverId as ""}/members/${memberId as ""}`);
    const user = await this.apiWrapper.users.fetch(memberId);

    return this.createObj({
      revolt: res,
      discord: await Member.from_quark(res, { discordUser: user.discord }),
    });
  }

  async fetchMembers(serverId: string, excludeOffline = true, cache = true) {
    const members = await this.rvAPI.get(`/servers/${serverId as ""}/members`, {
      exclude_offline: excludeOffline,
    });

    return members;
  }

  async fetchAll(serverId: string, excludeOffline?: boolean) {
    if (this.fullyCached.find((x) => x === serverId)) return Array.from(this.values());

    const members = await this.fetchMembers(serverId, excludeOffline);

    const memberHandlers = await Promise.all(members.members.map(async (x, i) => {
      if (!members.users[i]) Logger.warn(`Incorrect mapping for ${x._id.user}! Please report this!`);

      const user = this.apiWrapper.users.createObj({
        revolt: members.users[i]!,
        discord: await User.from_quark(members.users[i]!),
      });

      return this.createObj({
        revolt: x,
        discord: await Member.from_quark(x, { discordUser: user.discord }),
      });
    }));

    this.fullyCached.push(serverId);

    return memberHandlers;
  }
}

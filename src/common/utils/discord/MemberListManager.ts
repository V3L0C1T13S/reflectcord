import { APIGuild } from "discord.js";
import { MemberList } from "./MemberList";
import { GatewayLazyRequestDispatchData, LazyOpMember } from "../../sparkle";

/**
 * Generic member list manager, meant to be used per
 * subscribed server.
 */
export class MemberListManager {
  /**
   * List of member lists by list id
  */
  private lists: Record<string, MemberList> = {};

  getList(id: string) {
    return this.lists[id];
  }

  deleteList(id: string) {
    delete this.lists[id];
  }

  addList(list: MemberList) {
    this.lists[list.id] = list;
  }

  createList(guildId: string, id: string, guild: APIGuild) {
    const list = new MemberList(guildId, id, guild);
    this.addList(list);

    return list;
  }

  /**
   * Update a users presence for all member lists
  */
  updatePresence(id: string, presence: LazyOpMember["presence"]): GatewayLazyRequestDispatchData[] {
    const data: GatewayLazyRequestDispatchData[] = [];

    Object.values(this.lists).forEach((list) => {
      const index = list.findMemberItemIndex(id);
      if (!index) return;

      const ops = list.updatePresence(index, presence);
      if (!ops?.length) return;

      data.push({
        ops,
        groups: list.groups,
        guild_id: list.guildId,
        id: list.id,
        member_count: list.memberCount,
        online_count: list.onlineCount,
      });
    });

    return data;
  }

  deleteMemberAndRecalculate(id: string): GatewayLazyRequestDispatchData[] {
    const data: GatewayLazyRequestDispatchData[] = [];

    Object.values(this.lists).forEach((list) => {
      const ops = list.deleteMemberAndRecalculate(id);
      if (!ops?.length) return;

      data.push({
        ops,
        groups: list.groups,
        guild_id: list.guildId,
        id: list.id,
        member_count: list.memberCount,
        online_count: list.onlineCount,
      });
    });

    return data;
  }
}

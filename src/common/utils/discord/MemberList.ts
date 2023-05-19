import {
  APIGuildMember,
} from "discord.js";
import {
  LazyOperatorDelete,
  LazyOperatorInsert,
  LazyOperatorSync,
  LazyOperatorUpdate,
  LazyGroup,
  LazyOpMember,
  LazyItem,
  LazyRange,
  LazyOperators,
} from "../../sparkle";

/**
 * Generic member list using only lazy items.
*/
export class MemberList {
  guildId: string;
  id: string;
  items: LazyItem[] = [];
  groups: LazyGroup[] = [];
  members = new Map<string, APIGuildMember>();
  onlineCount: number = 0;
  memberCount: number = 0;

  constructor(guildId: string, id: string) {
    this.guildId = guildId;
    this.id = id;
  }

  update(index: number, item: LazyItem): LazyOperatorUpdate {
    if ("member" in item) {
      if (!item.member.user) throw new Error(`members should have a user property! ${item}`);
      this.items[index] = item;
      this.members.set(item.member.user.id, item.member);
    } else if ("group" in item) {
      this.items[index] = item;
    }

    return {
      op: "UPDATE",
      index,
      item,
    };
  }

  recalculateMemberPosition(index: number) {
    const ops: LazyOperators[] = [];

    const member = this.items[index];
    if (!member || !("member" in member) || !member.member.user) return;

    const currentGroup = this.getMemberGroup(member.member.user.id);
    const highestGroup = this.groups.find((x) => member.member.roles.includes(x.id));
    if (!highestGroup || !currentGroup) return;

    ops.push(
      ...this.deleteAndRecalculate(index),
      ...(this.addItemToGroup(highestGroup.id, member) ?? []),
    );

    return ops;
  }

  updateAndRecalculate(index: number, item: LazyItem) {
    const ops: LazyOperators[] = [];

    ops.push(this.update(index, item));
    const recalculated = this.recalculateMemberPosition(index);
    if (!recalculated) return;

    ops.push(...recalculated);

    return ops;
  }

  updatePresence(index: number, presence: LazyOpMember["presence"]) {
    const ops: LazyOperators[] = [];

    const existing = this.items[index];
    if (!existing) return;

    if (!("member" in existing) || !existing.member.user) return;

    ops.push(this.update(index, {
      ...existing,
      member: {
        ...existing.member,
        presence,
      },
    }));

    if (presence.status === "offline") {
      ops.push(...this.deleteAndRecalculate(index));
      ops.push(...(this.addItemToGroup("offline", existing) ?? []));
    }

    return ops;
  }

  sync(range: LazyRange, items: LazyItem[]): LazyOperatorSync {
    const start = range[0];
    items.forEach((item, i) => this.update(start + i, item));

    return {
      op: "SYNC",
      items,
      range,
    };
  }

  addItemToGroup(id: string, item: LazyItem, create = true): LazyOperators[] | undefined {
    const ops: LazyOperators[] = [];

    let index = this.findGroupItemIndex(id);
    let group = this.items[index];
    if (!group) {
      if (!create) return ops;

      group = {
        group: {
          count: 0,
          id,
        },
      };

      ops.push(this.insert(this.items.length, group));
      index = this.findGroupItemIndex(id);
    }
    if (!("group" in group)) return ops;

    group.group.count += 1;
    ops.push(this.update(index, group));
    ops.push(this.insert(index + 1, item));

    return ops;
  }

  insert(index: number, item: LazyItem): LazyOperatorInsert {
    if ("group" in item) {
      this.groups.push(item.group);
    }

    this.items.splice(index, 0, item);

    return {
      op: "INSERT",
      index,
      item,
    };
  }

  delete(index: number): LazyOperatorDelete {
    const existing = this.items[index];
    if (existing) {
      this.items.splice(index, 1);
    }

    return {
      op: "DELETE",
      index,
    };
  }

  deleteAndRecalculate(index: number): LazyOperators[] {
    const ops: LazyOperators[] = [];

    const item = this.items[index];
    if (!item) return ops;

    if ("member" in item && item.member.user) {
      const group = this.getMemberGroup(item.member.user.id);
      if (group) {
        const groupIndex = this.findGroupItemIndex(group.group.id);
        group.group.count -= 1;
        if (group.group.count <= 0) {
          const groupCountIndex = this.groups.findIndex((x) => x.id === group.group.id);
          this.groups.splice(groupCountIndex, 1);
          ops.push(this.delete(groupIndex));
        }
      }
    }

    ops.push(this.delete(index));

    return ops;
  }

  setGroups(groups: LazyGroup[]) {
    this.groups = groups;
  }

  findMemberItemIndex(id: string) {
    return this.items.findIndex((x) => "member" in x && x.member.user && x.member.user.id === id);
  }

  findGroupItemIndex(id: string) {
    return this.items.findIndex((x) => "group" in x && x.group.id === id);
  }

  getMemberGroup(id: string) {
    const memberIndex = this.findMemberItemIndex(id);
    const member = this.members.get(id);

    if (!member || !memberIndex) return;

    const memberGroup = [...this.items].slice(0, memberIndex).reverse().find((x) => "group" in x);
    if (!memberGroup || !("group" in memberGroup)) return;

    return memberGroup;
  }
}

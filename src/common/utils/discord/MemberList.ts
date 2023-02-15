import { APIGuildMember, PresenceData } from "discord.js";
import { TypedEmitter } from "tiny-typed-emitter";
import { APIWrapper } from "@reflectcord/common/rvapi";
import {
  LazyOperatorDelete,
  LazyOperatorInsert,
  LazyOperatorSync,
  LazyOperatorUpdate,
  LazyGroup,
  SyncItem,
  LazyOpMember,
  LazyItem,
  LazyRange,
} from "../../sparkle";

export interface MemberListEvents {
  "memberInsert": (data: LazyOperatorInsert) => unknown,
  "memberDelete": (data: LazyOperatorDelete) => unknown,
  "memberUpdate": (data: LazyOperatorUpdate) => unknown,
  "listSync": (data: LazyOperatorSync) => unknown,
}

export type MemberListFindParams = { id: string } | { index: number };

/**
 * Generic member list - Members are applied by imitating
 * a client perspective of an entire list of members
 */
export class MemberList extends TypedEmitter<MemberListEvents> {
  members: APIGuildMember[] = [];
  groups: LazyGroup[] = [];
  /**
   * @summary Lazy items this list is storing
   *
   * Note for developers: Avoid mutating this list in async
   * code, as this may mutate the position of offline users.
  */
  items: LazyItem[] = [];
  readonly guildId: string;
  range: LazyRange = [0, 99];
  // maybe we *don't* want this so we can keep it portable
  apiWrapper: APIWrapper;

  constructor(apiWrapper: APIWrapper, guildId: string) {
    super();

    this.apiWrapper = apiWrapper;
    this.guildId = guildId;
  }

  isInRange = (x: number) => x >= this.range[0] && x <= this.range[1];

  protected createSyncItem(member: APIGuildMember, presence: LazyOpMember["presence"]) {
    const userRoles = member.roles.filter((r) => r !== this.guildId);

    const item: SyncItem = {
      ...member,
      roles: userRoles,
      presence,
    };

    return item;
  }

  protected setOfflineItems(items: LazyItem[]) {
    let offline = this.groups.find((group) => group.id === "offline");
    if (!offline) {
      offline = {
        count: items.length,
        id: "offline",
      };
      // FIXME: We need to check for every push that offline members are the last in the list.
      this.items.push({ group: offline });
      this.groups.push(offline);
    }

    this.items.push(...items);
  }

  /**
   * @summary Create a lazy group, and filter out offline members
   * from the new group into the offline one.
   *
   * This pushes the group to the groups array, and pushes a
   * group item inside the items array.
   * @param members Members to initially add to the group
   * @param role The role to create the group for.
   * @returns The newly created group
   */
  createGroup(members: LazyOpMember[], role: string) {
    const offlineItems: LazyItem[] = [];
    const group: SyncItem = {
      count: members.length,
      id: role === this.guildId ? "online" : role,
    };

    this.items.push({ group });
    this.groups.push(group);

    members.forEach((member) => {
      const item = { member: this.createSyncItem(member, {}) };

      if (item.member.presence.status === "invisible"
      || item.member.presence.status === "offline") {
        item.member.presence.status = "offline";
        offlineItems.push(item);
        // FIXME: We should preferrably filter offline users to their own group beforehand
        group.count -= 1;
      } else this.items.push(item);
    });

    if (offlineItems.length > 0) {
      this.setOfflineItems(offlineItems);
    }

    return group;
  }

  deleteMember(params: MemberListFindParams) {
    const memberIndex = this.findMemberIndex(params);
    if (!memberIndex) throw new Error(`Couldn't find member index using ${params}`);

    this.items.splice(memberIndex, 1);

    // TODO (lazy members): Pop off empty groups from list

    this.emit("memberDelete", {
      op: "DELETE",
      index: memberIndex,
      guild_id: this.guildId,
    });
  }

  findMemberIndex(params: MemberListFindParams) {
    return "index" in params
      ? params.index
      : this.items.findIndex((item) => "member" in item && item.member.user?.id === params.id);
  }

  findMember(params: MemberListFindParams) {
    return this.items[this.findMemberIndex(params)];
  }

  insertMember(member: APIGuildMember, presence: PresenceData) {
    const syncItem = this.createSyncItem(member, presence);

    const memberIndex = this.items
      .findIndex((group) => "group" in group && member.roles.includes(group.group.id))
      ?? this.items.findIndex((group) => "group" in group && group.group.id === "online");

    const item: LazyItem = { member: syncItem };
    this.items.insert(item, memberIndex);

    this.emit("memberInsert", {
      op: "INSERT",
      item,
      index: memberIndex,
      guild_id: this.guildId,
    });
  }

  updateMember(params: MemberListFindParams) {
    const index = this.findMemberIndex(params);
    const item = this.items[index];
    if (!item || !("member" in item)) throw new Error(`Member ${params} was not found.`);

    this.emit("memberUpdate", {
      op: "UPDATE",
      index,
      item,
      guild_id: this.guildId,
    });
  }

  /**
   * @summary Do a SYNC operation. This emits the "listSync" event
   * on completion.
   */
  sync() {
    this.emit("listSync", {
      op: "SYNC",
      range: this.range,
      id: "everyone",
      guild_id: this.guildId,
      groups: this.groups,
      member_count: this.items.length,
      items: this.items,
    });
  }

  /**
   * @summary Initialize the member list by populating it with members,
   * and then running through a SYNC operation.
   * @param members Members to use for initialization
   */
  initialize(members: LazyOpMember[]) {
    const roles = members.map((member) => member.roles)
      .flat()
      .unique();

    roles.push(this.guildId);

    roles.forEach((role) => {
      const roleMembers = members.filter((member) => member.roles.includes(role));

      this.createGroup(roleMembers, role);
    });

    this.sync();
  }
}

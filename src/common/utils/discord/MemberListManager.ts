import { MemberList } from "./MemberList";

export class MemberListManager {
  private lists: Record<string, MemberList> = {};

  getList(id: string) {
    return this.lists[id];
  }

  deleteList(id: string) {
    delete this.lists[id];
  }

  addList(list: MemberList) {
    this.lists[list.guildId] = list;
  }
}

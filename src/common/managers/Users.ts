import { APIUser } from "discord.js";
import { runInAction } from "mobx";
import { API } from "revolt.js";
import { Logger } from "../utils";
import { User } from "../models";
import { BaseManager } from "./BaseManager";
import { QuarkContainer } from "./types";

export type UserContainer = QuarkContainer<API.User, APIUser>

export class UserManager extends BaseManager<string, UserContainer> {
  $get(id: string, data?: UserContainer) {
    const user = this.get(id)!;

    return user;
  }

  async fetch(id: string, data?: UserContainer) {
    if (this.has(id)) return this.$get(id, data);

    Logger.log(`fetching new user ${id}`);

    if (data) return this.createObj(data);

    const res = await this.rvAPI.get(`/users/${id as ""}`);

    return this.createObj({
      revolt: res,
      discord: await User.from_quark(res),
    });
  }

  createObj(user: UserContainer) {
    if (this.has(user.revolt._id)) return this.$get(user.revolt._id, user);

    runInAction(() => {
      this.set(user.revolt._id, user);
    });

    return user;
  }

  getSelf() {
    return this.rvAPI.get("/users/@me");
  }

  getUser(id: string) {
    return this.fetch(id);
  }
}

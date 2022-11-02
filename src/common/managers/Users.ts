import { APIUser } from "discord.js";
import { runInAction } from "mobx";
import { API } from "revolt.js";
import { Logger } from "../utils";
import { User } from "../models";
import { BaseManager } from "./BaseManager";
import { QuarkContainer } from "./types";
import { APIWrapper } from "../rvapi";

export type UserContainer = QuarkContainer<API.User, APIUser>

export class UserManager extends BaseManager<string, UserContainer> {
  selfId?: string;

  constructor(api: APIWrapper) {
    super(api);

    this.set("00000000000000000000000000", {
      revolt: {
        _id: "00000000000000000000000000",
        username: "Revolt",
      },
      discord: {
        id: "0",
        username: "Revolt",
        discriminator: "1",
        avatar: null,
      },
    });
  }

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

  /**
   * @param foreign Get extra info about yourself
   * @returns
   */
  async getSelf(foreign?: boolean) {
    if (foreign) return this.rvAPI.get(`/users/${await this.getSelfId() as ""}`);
    return this.rvAPI.get("/users/@me");
  }

  async getSelfId() {
    if (this.selfId) return this.selfId;
    const info = await this.rvAPI.get("/auth/account/");
    this.selfId = info._id;

    return info._id;
  }

  getUser(id: string) {
    return this.fetch(id);
  }

  getProfile(id: string) {
    return this.rvAPI.get(`/users/${id as ""}/profile`);
  }
}

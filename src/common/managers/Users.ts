import { API } from "revolt.js";
import { User } from "../models";
import { BaseManager } from "./BaseManager";

export class UserManager extends BaseManager {
  getSelf() {
    return this.rvAPI.get("/users/@me");
  }

  async getUser(id: string) {
    const rvUser = await this.rvAPI.get(`/users/${id}`) as API.User;

    return {
      revolt: {
        user: rvUser,
      },
      discord: await User.from_quark(rvUser),
    };
  }
}

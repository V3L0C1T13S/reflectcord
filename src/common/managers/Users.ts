import { BaseManager } from "./BaseManager";

export class UserManager extends BaseManager {
  getSelf() {
    return this.rvAPI.get("/users/@me");
  }
}

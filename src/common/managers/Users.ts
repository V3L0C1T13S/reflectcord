import { APIUser } from "discord.js";
import API from "revolt-api";
import { isEqual } from "lodash";
import { Logger } from "@reflectcord/common/utils";
import { DbManager } from "@reflectcord/common/db";
import { RevoltSettings, SettingsKeys, User } from "../models";
import { BaseManager } from "./BaseManager";
import { QuarkContainer } from "./types";
import { APIWrapper } from "../rvapi";

export type UserContainer = QuarkContainer<API.User, APIUser>
export type UserI = QuarkContainer<Partial<API.User>, Partial<APIUser>>;

export class UserManager extends BaseManager<string, UserContainer> {
  selfId?: string;

  constructor(api: APIWrapper) {
    super(api);

    this.set("00000000000000000000000000", {
      revolt: {
        _id: "00000000000000000000000000",
        username: "Revolt",
        discriminator: "0001",
      },
      discord: {
        id: "0",
        username: "Revolt",
        discriminator: "0001",
        avatar: null,
      },
    });
  }

  $get(id: string, data?: UserI) {
    const user = this.get(id)!;

    return user;
  }

  async mongoFetchUser(id: string) {
    const user = await DbManager.revoltUsers.findOne({ _id: id });
    if (!user) throw new Error(`user ${id} does not exist`);

    return this.createObj({
      revolt: user,
      discord: await User.from_quark(user),
    });
  }

  async fetch(id: string, data?: UserContainer) {
    if (this.has(id)) return this.$get(id, data);

    switch (this.apiWrapper.mode) {
      case "mongo": {
        return this.mongoFetchUser(id);
      }
      default: {
        if (data) return this.createObj(data);

        const res = await this.rvAPI.get(`/users/${id as ""}`);

        return this.createObj({
          revolt: res,
          discord: await User.from_quark(res),
        });
      }
    }
  }

  createObj(user: UserContainer) {
    if (this.has(user.revolt._id)) return this.$get(user.revolt._id, user);

    this.set(user.revolt._id, user);

    return user;
  }

  private async mongoFetchSelf() {
    const session: any = await DbManager.revoltSessions
      .findOne({ token: this.apiWrapper.token });
    const user = await DbManager.revoltUsers.findOne({ _id: session?.user_id });
    if (!user) throw new Error(`user ${session?.user_id} doesn't exist!`);

    return this.createObj({
      revolt: user,
      discord: await User.from_quark(user),
    });
  }

  async fetchSelf() {
    switch (this.apiWrapper.mode) {
      case "mongo": {
        return this.mongoFetchSelf();
      }
      default: {
        const user = await this.rvAPI.get(`/users/${await this.getSelfId() as ""}`);

        return this.createObj({
          revolt: user,
          discord: await User.from_quark(user),
        });
      }
    }
  }

  private async mongoFetchSettings() {
    const user = await this.fetchSelf();
    const settings = await DbManager.revoltSettings.findOne({ _id: user.revolt._id });

    if (!settings) throw new Error(`no settings for ${user.revolt._id}`);

    return settings;
  }

  async fetchSettings() {
    switch (this.apiWrapper.mode) {
      case "mongo": {
        return this.mongoFetchSettings();
      }
      default: {
        return this.rvAPI.post("/sync/settings/fetch", { keys: SettingsKeys }) as RevoltSettings;
      }
    }
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
    const user = await this.rvAPI.get("/users/@me");
    this.selfId = user._id;

    return user._id;
  }

  getUser(id: string) {
    return this.fetch(id);
  }

  getProfile(id: string) {
    return this.rvAPI.get(`/users/${id as ""}/profile`);
  }

  update(id: string, data: UserI, clear?: API.FieldsUser[]) {
    const user = this.get(id)!;
    const apply = (ctx: string, key: string, target?: string) => {
      if (
        // @ts-expect-error TODO: clean up types here
        typeof data[ctx][key] !== "undefined"
            // @ts-expect-error TODO: clean up types here
            && !isEqual(user[ctx][target ?? key], data[ctx][key])
      ) {
        // @ts-expect-error TODO: clean up types here
        user[ctx][target ?? key] = data[ctx][key];
      }
    };

    clear?.forEach((entry) => {
      switch (entry) {
        case "Avatar":
          user.revolt.avatar = null;
          break;
        case "StatusText": {
          if (user.revolt.status) {
            user.revolt.status.text = null;
          }
          break;
        }
        default: {
          Logger.warn(`unhandled user clear ${entry}`);
          break;
        }
      }
    });

    const applyRevolt = (key: string, target?: string) => apply("revolt", key, target);
    const applyDiscord = (key: string, target?: string) => apply("discord", key, target);

    applyRevolt("username");
    applyRevolt("avatar");
    applyRevolt("badges");
    applyRevolt("status");
    applyRevolt("relationship");
    applyRevolt("online");
    applyRevolt("priviliged");
    applyRevolt("flags");
    applyRevolt("bot");

    applyDiscord("username");
    applyDiscord("avatar");
    applyDiscord("banner");
    applyDiscord("flags");
    applyDiscord("bot");
    applyDiscord("public_flags");
  }
}

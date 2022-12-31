import { APIChannel } from "discord.js";
import { isEqual } from "lodash";
import { API } from "revolt.js";
import { Logger } from "../utils";
import { Channel } from "../models";
import { BaseManager } from "./BaseManager";
import { QuarkContainer } from "./types";

export type ChannelContainer = QuarkContainer<API.Channel, APIChannel>;
export type channelI = QuarkContainer<Partial<API.Channel>, Partial<APIChannel>>;

export class ChannelsManager extends BaseManager<string, ChannelContainer> {
  $get(id: string, data?: channelI) {
    if (data) this.update(id, data);
    const channel = this.get(id)!;
    return channel;
  }

  async fetch(id: string, data?: ChannelContainer) {
    if (this.has(id)) return this.$get(id);

    if (data) return this.createObj(data);

    // Logger.log(`getting new channel ${id}`);

    const res = await this.rvAPI.get(`/channels/${id as ""}`);

    return this.createObj({
      revolt: res,
      discord: await Channel.from_quark(res),
    });
  }

  createObj(channel: ChannelContainer) {
    if (this.has(channel.revolt._id)) return this.$get(channel.revolt._id, channel);

    this.set(channel.revolt._id, channel);

    return channel;
  }

  async addToGroup(id: string, user: string) {
    await this.rvAPI.put(`/channels/${id}/recipients/${user}`);
  }

  async removeFromGroup(id: string, user: string) {
    await this.rvAPI.delete(`/channels/${id}/recipients/${user}`);
  }

  update(id: string, data: channelI, clear?: string[]) {
    const channel = this.get(id)!;

    const apply = (ctx: string, key: string, target?: string) => {
      if (
      // @ts-expect-error TODO: clean up types here
        typeof data[ctx][key] !== "undefined"
          // @ts-expect-error TODO: clean up types here
          && !isEqual(channel[ctx][target ?? key], data[ctx][key])
      ) {
        // @ts-expect-error TODO: clean up types here
        channel[ctx][target ?? key] = data[ctx][key];
      }
    };

    clear?.forEach((entry) => {
      switch (entry) {
        case "Description": {
          // @ts-ignore
          delete channel.revolt.description;
          break;
        }
        default:
      }
    });

    apply("revolt", "active");
    apply("revolt", "owner", "owner_id");
    apply("revolt", "permissions");
    apply("revolt", "default_permissions");
    apply("revolt", "role_permissions");
    apply("revolt", "name");
    apply("revolt", "icon");
    apply("revolt", "description");
    apply("revolt", "recipients", "recipient_ids");
    apply("revolt", "last_message_id");
    apply("revolt", "nsfw");

    apply("discord", "name");
    apply("discord", "topic");
    apply("discord", "last_message_id");
    apply("discord", "recipients");
    apply("discord", "permission_overwrites");
    apply("discord", "owner_id");
    apply("discord", "icon");
    apply("discord", "nsfw");
    // FIXME: Overridden with null by Channel.from_quark()
    // apply("discord", "parent_id");
  }
}

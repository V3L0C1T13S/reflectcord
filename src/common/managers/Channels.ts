import { APIChannel } from "discord.js";
import { isEqual } from "lodash";
import { API } from "revolt.js";
import { DbManager } from "@reflectcord/common/db";
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

  private async fetchChannelMongo(id: string) {
    const res = await DbManager.revoltChannels.findOne({ _id: id });
    if (!res) throw new Error(`channel ${id} not found`);

    return this.createObj({
      revolt: res,
      discord: await Channel.from_quark(res),
    });
  }

  async fetch(id: string, data?: ChannelContainer) {
    if (this.has(id)) return this.$get(id);

    if (data) return this.createObj(data);

    switch (this.apiWrapper.mode) {
      default: {
        const res = await this.rvAPI.get(`/channels/${id as ""}`);

        return this.createObj({
          revolt: res,
          discord: await Channel.from_quark(res),
        });
      }
    }
  }

  async mongoFetchDmChannels() {
    const user = await this.apiWrapper.users.fetchSelf();
    const rvDms = await DbManager.revoltChannels
      .find({ recipients: { $all: [user.revolt._id] } }).toArray();

    return Promise.all(rvDms.map(async (channel) => this.createObj({
      revolt: channel,
      discord: await Channel.from_quark(channel),
    })));
  }

  async fetchDmChannels() {
    switch (this.apiWrapper.mode) {
      case "mongo": {
        return this.mongoFetchDmChannels();
      }
      default: {
        const rvDms = await this.rvAPI.get("/users/dms");

        if (!Array.isArray(rvDms)) throw new Error("Bad response from Revolt.");

        const dmObjects = await Promise.all(rvDms
          .map(async (channel) => this.createObj({
            revolt: channel,
            discord: await Channel.from_quark(channel),
          })));

        return dmObjects;
      }
    }
  }

  fetchWebhooks(rvChannelId: string) {
    return this.rvAPI.get(`/channels/${rvChannelId as ""}/webhooks`);
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

  async editChannel(id: string, data: API.DataEditChannel) {
    const updated = this.rvAPI.patch(`/channels/${id as ""}`, data);

    return updated;
  }

  async deleteChannel(id: string, leaveSilently?: boolean, avoidReq?: boolean) {
    const channel = this.get(id);

    if (!avoidReq) {
      await this.rvAPI.delete(`/channels/${id as ""}`, {
        leave_silently: leaveSilently,
      });
    }

    if (!channel) return;

    if (channel.revolt.channel_type === "DirectMessage") {
      channel.revolt.active = false;
    }

    if (channel.revolt.channel_type === "TextChannel"
      || channel.revolt.channel_type === "VoiceChannel") {
      const server = this.apiWrapper.servers.get(channel.revolt.server);
      if (server) {
        server.revolt.channels = server.revolt.channels.filter(
          (x) => x !== channel.revolt._id,
        );
      }
    }

    this.delete(channel.revolt._id);
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
          if ("description" in channel.revolt) delete channel.revolt.description;
          break;
        }
        case "Icon": {
          if ("icon" in channel.revolt) delete channel.revolt.icon;
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
    apply("revolt", "recipients");
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

import { APIChannel } from "discord.js";
import { runInAction } from "mobx";
import { API } from "revolt.js";
import { Logger } from "../utils";
import { Channel } from "../models";
import { BaseManager } from "./BaseManager";
import { QuarkContainer } from "./types";

export type ChannelContainer = QuarkContainer<API.Channel, APIChannel>;

export class ChannelsManager extends BaseManager<string, ChannelContainer> {
  $get(id: string, data?: ChannelContainer) {
    return this.get(id)!;
  }

  async fetch(id: string, data?: ChannelContainer) {
    if (this.has(id)) return this.$get(id);

    if (data) return this.createObj(data);

    Logger.log(`getting new channel ${id}`);

    const res = await this.rvAPI.get(`/channels/${id as ""}`);

    return this.createObj({
      revolt: res,
      discord: await Channel.from_quark(res),
    });
  }

  createObj(channel: ChannelContainer) {
    if (this.has(channel.revolt._id)) return this.$get(channel.revolt._id, channel);

    runInAction(() => {
      this.set(channel.revolt._id, channel);
    });

    return channel;
  }
}

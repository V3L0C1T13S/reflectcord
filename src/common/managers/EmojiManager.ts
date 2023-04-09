import { APIEmoji } from "discord.js";
import { API } from "revolt.js";
import { Emoji } from "@reflectcord/common/models";
import { BaseManager } from "./BaseManager";
import { QuarkContainer } from "./types";

export type EmojiContainer = QuarkContainer<API.Emoji, APIEmoji>;
export type emojiI = QuarkContainer<Partial<API.Emoji>, Partial<APIEmoji>>;

export class EmojiManager extends BaseManager<string, EmojiContainer> {
  $get(id: string, data?: emojiI) {
    // if (data) this.update(id, data);
    const emoji = this.get(id)!;
    return emoji;
  }

  createObj(data: EmojiContainer) {
    if (this.has(data.revolt._id)) return this.$get(data.revolt._id);

    this.set(data.revolt._id, data);

    return data;
  }

  async fetch(id: string) {
    if (this.has(id)) return this.$get(id);

    const res = await this.rvAPI.get(`/custom/emoji/${encodeURI(id) as ""}`);

    return this.createObj({
      revolt: res,
      discord: await Emoji.from_quark(res, {
        discordUser: this.apiWrapper.users.get(res.creator_id)?.discord,
      }),
    });
  }

  getServerEmojis(server: string) {
    return [...this.values()]
      .filter((x) => x.revolt.parent.type === "Server" && x.revolt.parent.id === server);
  }
}

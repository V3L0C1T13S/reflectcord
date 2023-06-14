import { APIMessage } from "discord.js";
import { API } from "revolt.js";
import { isEqual } from "lodash";
import { Logger } from "@reflectcord/common/utils";
import {
  interactionTitle, Message, MessageAFQ, User,
} from "../models";
import { BaseManager } from "./BaseManager";
import { QuarkContainer } from "./types";
import { systemUserID } from "../rvapi/users";
import { DbManager } from "../db";

export type MessageContainer = QuarkContainer<API.Message, APIMessage>;
export type MessageI = QuarkContainer<Partial<API.Message>, Partial<APIMessage>>;

type messageInclude = {
  mentions: boolean,
}

type messageExtra = MessageAFQ;

export const digitMap: Record<number, string> = {
  0: "0️⃣",
  1: "1️⃣",
  2: "2️⃣",
  3: "3️⃣",
  4: "4️⃣",
  5: "5️⃣",
  6: "6️⃣",
  7: "7️⃣",
  8: "8️⃣",
  9: "9️⃣",
};

export const emojiMap: Record<string, number> = {
  "0️⃣": 0,
  "1️⃣": 1,
  "2️⃣": 2,
  "3️⃣": 3,
  "4️⃣": 4,
  "5️⃣": 5,
  "6️⃣": 6,
  "7️⃣": 7,
  "8️⃣": 8,
  "9️⃣": 9,
};

export class MessageManager extends BaseManager<string, MessageContainer> {
  $get(id: string, data?: MessageContainer) {
    if (data) this.update(id, data);

    const msg = this.get(id)!;

    return msg;
  }

  async convertMessageObj(rvMessage: API.Message, include?: messageInclude, extra?: messageExtra) {
    const authorInfo = await (async () => {
      if (rvMessage.masquerade) return null;

      if (rvMessage.author === systemUserID) {
        if (rvMessage.system) {
          switch (rvMessage.system.type) {
            case "user_remove": {
              return this.apiWrapper.users.fetch(rvMessage.system.by);
            }
            case "user_added": {
              return this.apiWrapper.users.fetch(rvMessage.system.by);
            }
            case "user_joined": {
              return this.apiWrapper.users.fetch(rvMessage.system.id);
            }
            case "channel_renamed": {
              return this.apiWrapper.users.fetch(rvMessage.system.by);
            }
            default: {
              return null;
            }
          }
        }
      } else {
        return this.apiWrapper.users.fetch(rvMessage.author);
      }

      return null;
    })().catch(() => null);

    const repliedMessage = rvMessage.replies?.[0] ? this.get(rvMessage.replies[0]) : null;
    const discordMessage = await Message.from_quark(rvMessage, {
      mentions: include?.mentions ? (await this.getMessageMentions(rvMessage))
        .map((x) => x.revolt) : null,
      replied_message: repliedMessage?.discord ?? null,
      ...extra,
      user: extra?.user ?? authorInfo?.revolt,
      selfUserId: this.apiWrapper.users.selfId ?? null,
    });

    this.createObj({
      revolt: rvMessage,
      discord: discordMessage,
    });

    return {
      revolt: {
        message: rvMessage,
        author: authorInfo,
      },
      discord: {
        ...discordMessage,
        author: authorInfo?.discord ?? discordMessage.author,
      },
    };
  }

  createObj(data: MessageContainer) {
    if (this.has(data.revolt._id)) return this.$get(data.revolt._id);

    this.set(data.revolt._id, data);

    return data;
  }

  async fetch(channel: string, id: string, include?: messageInclude) {
    if (this.has(id)) return this.$get(id);

    const rvMessage = await this.rvAPI.get(`/channels/${channel as ""}/messages/${id as ""}`);

    const convertedMessage = await this.convertMessageObj(rvMessage, include);

    return this.createObj({
      revolt: rvMessage,
      discord: convertedMessage.discord,
    });
  }

  async fetchUnreads() {
    switch (this.apiWrapper.mode) {
      case "mongo": {
        const user = await this.apiWrapper.users.fetchSelf();
        const unreads = await DbManager.revoltChannelUnreads
          .find({ _id: { user: user.revolt._id } }).toArray();
        if (!unreads) throw new Error(`no unreads for ${user.revolt._id}`);

        return unreads;
      }
      default: {
        return this.rvAPI.get("/sync/unreads");
      }
    }
  }

  async getMessage(channel: string, id: string) {
    const rvMessage = await this.rvAPI.get(`/channels/${channel as ""}/messages/${id as ""}`);

    return this.convertMessageObj(rvMessage);
  }

  async sendMessage(
    channel: string,
    data: API.DataMessageSend,
  ) {
    const revoltResponse = await this.rvAPI.post(
      `/channels/${channel as ""}/messages`,
      data,
    );

    const discordMessage = await Message.from_quark(revoltResponse);
    const selfUser = await this.apiWrapper.users.getSelf(false);

    const interactionEmbed = revoltResponse.embeds?.last();
    if (interactionEmbed?.type === "Text" && interactionEmbed.title === interactionTitle && interactionEmbed.description) {
      try {
        const reactionNumbers = interactionEmbed.description.split("\n").map((x) => x[0]?.toNumber())
          .filter((x): x is number => x !== undefined);

        const reactions = reactionNumbers.map((x) => digitMap[x])
          .filter((x): x is string => !!x);

        await Promise.all(reactions.map(async (x) => {
          await this.rvAPI.put(`/channels/${channel as ""}/messages/${revoltResponse._id as ""}/reactions/${encodeURIComponent(x) as ""}`);
        }));
      } catch (e) {
        Logger.error(`Couldn't add interaction bridge ${e}`);
      }
    }

    if (!this.apiWrapper.bot) this.ack(channel, revoltResponse._id).catch(Logger.error);

    return {
      revolt: {
        message: revoltResponse,
      },
      discord: {
        ...discordMessage,
        author: await User.from_quark(selfUser),
      },
    };
  }

  async editMessage(
    channel: string,
    id: string,
    data: API.DataEditMessage,
    extra?: { fixEmbedComponentUpdate: boolean },
  ) {
    const revoltData = data;
    if (extra?.fixEmbedComponentUpdate) {
      const currentMessage = await this.fetch(channel, id);

      const selectedEmbeds: API.Embed[] = currentMessage.revolt.embeds?.filter((x) => x.type === "Text") ?? [];

      const oldInteractionEmbed = selectedEmbeds.last();
      const newInteractionEmbed = revoltData.embeds?.last();

      // HACK! Works around embeds being overridden by our interaction embed
      if (
        revoltData.embeds?.length === 1
        && revoltData.embeds[0]?.title === interactionTitle
        && selectedEmbeds.length > 1
      ) {
        if (oldInteractionEmbed?.type === "Text" && oldInteractionEmbed.title === interactionTitle) {
          selectedEmbeds.pop();
        }
        // TODO (types)
        // @ts-ignore
        revoltData.embeds = [...selectedEmbeds, ...revoltData.embeds];
      } else if (newInteractionEmbed?.title !== interactionTitle && oldInteractionEmbed?.type === "Text" && oldInteractionEmbed.title === interactionTitle) {
        // @ts-ignore
        revoltData.embeds = [...revoltData.embeds, oldInteractionEmbed];
      }
    }

    const response = await this.rvAPI.patch(`/channels/${channel as ""}/messages/${id as ""}`, revoltData);

    return response;
  }

  ack(channel:string, id: string) {
    return this.rvAPI.put(`/channels/${channel as ""}/ack/${id as ""}`);
  }

  async bulkDelete(channel: string, ids: string[]) {
    await this.rvAPI.delete(`/channels/${channel as ""}/messages/bulk`, {
      ids,
    });
  }

  deleteMessage(channel: string, id: string) {
    return this.rvAPI.delete(`/channels/${channel as ""}/messages/${id as ""}`);
  }

  async getMessageMentions(message: API.Message) {
    if (!message.mentions) return [];

    return Promise.all(message.mentions
      .map((mention) => this.apiWrapper.users.fetch(mention)));
  }

  update(id: string, data: MessageI) {
    const msg = this.get(id)!;
    const apply = (ctx: string, key: string, target?: string) => {
      if (
        // @ts-expect-error TODO: clean up types here
        typeof data[ctx][key] !== "undefined"
            // @ts-expect-error TODO: clean up types here
            && !isEqual(msg[ctx][target ?? key], data[ctx][key])
      ) {
        // @ts-expect-error TODO: clean up types here
        msg[ctx][target ?? key] = data[ctx][key];
      }
    };
    const applyRevolt = (key: string, target?: string) => apply("revolt", key, target);
    const applyDiscord = (key: string, target?: string) => apply("discord", key, target);

    applyRevolt("content");
    applyRevolt("attachments");
    applyRevolt("edited");
    applyRevolt("embeds");
    // FIXME (REVOLT DELTA): this never updates
    applyRevolt("mentions");
    applyRevolt("masquerade");
    applyRevolt("reactions");
    applyRevolt("interactions");

    applyDiscord("content");
    applyDiscord("attachments");
    applyDiscord("edited_timestamp");
    applyDiscord("embeds");
    applyDiscord("mentions");
    applyDiscord("components");
    applyDiscord("reactions");
  }
}

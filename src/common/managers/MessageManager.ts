import { APIMessage } from "discord.js";
import { API } from "revolt.js";
import { isEqual } from "lodash";
import { Logger } from "@reflectcord/common/utils";
import { Message, MessageAFQ, User } from "../models";
import { BaseManager } from "./BaseManager";
import { QuarkContainer } from "./types";
import { systemUserID } from "../rvapi/users";

export type MessageContainer = QuarkContainer<API.Message, APIMessage>;
export type MessageI = QuarkContainer<Partial<API.Message>, Partial<APIMessage>>;

type messageInclude = {
  mentions: boolean,
}

type messageExtra = MessageAFQ;

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
              return this.apiWrapper.users.fetch(rvMessage.system.id);
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

    const discordMessage = await Message.from_quark(rvMessage, {
      mentions: include?.mentions ? (await this.getMessageMentions(rvMessage))
        .map((x) => x.revolt) : null,
      ...extra,
      user: extra?.user ?? authorInfo?.revolt,
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

    if (!this.apiWrapper.bot) await this.ack(channel, revoltResponse._id).catch(Logger.error);

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

  ack(channel:string, id: string) {
    return this.rvAPI.put(`/channels/${channel as ""}/ack/${id as ""}`);
  }

  async bulkDelete(channel: string, ids: string[]) {
    await this.rvAPI.delete(`/channels/${channel}/messages/bulk`, {
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
  }
}

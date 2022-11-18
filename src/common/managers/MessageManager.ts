import { APIMessage } from "discord.js";
import { API } from "revolt.js";
import { Message, User } from "../models";
import { BaseManager } from "./BaseManager";
import { QuarkContainer } from "./types";
import { systemUserID } from "../rvapi/users";

export type MessageContainer = QuarkContainer<API.Message, APIMessage>

export class MessageManager extends BaseManager<string, MessageContainer> {
  async convertMessageObj(rvMessage: API.Message) {
    const authorInfo = await (async () => {
      if (rvMessage.author === systemUserID) {
        if (rvMessage.system) {
          switch (rvMessage.system.type) {
            case "user_remove": {
              return this.apiWrapper.users.getUser(rvMessage.system.by);
            }
            case "user_added": {
              return this.apiWrapper.users.getUser(rvMessage.system.id);
            }
            case "user_joined": {
              return this.apiWrapper.users.getUser(rvMessage.system.id);
            }
            case "channel_renamed": {
              return this.apiWrapper.users.getUser(rvMessage.system.by);
            }
            default: {
              return null;
            }
          }
        }
      } else {
        return this.apiWrapper.users.getUser(rvMessage.author);
      }

      return null;
    })();

    const discordMessage = await Message.from_quark(rvMessage);
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
    const selfUser = await this.apiWrapper.users.getSelf();

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

  async ack(channel:string, id: string) {
    const res = await this.rvAPI.put(`/channels/${channel}/ack/${id}`);

    return res;
  }

  async bulkDelete(channel: string, ids: string[]) {
    await this.rvAPI.delete(`/channels/${channel}/messages/bulk`, {
      ids,
    });
  }
}

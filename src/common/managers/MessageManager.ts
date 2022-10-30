import { APIMessage } from "discord.js";
import { API } from "revolt.js";
import { Message, User } from "../models";
import { BaseManager } from "./BaseManager";
import { QuarkContainer } from "./types";

export class MessageManager extends BaseManager<string, QuarkContainer<API.Message, APIMessage>> {
  async convertMessageObj(rvMessage: API.Message) {
    const authorInfo = await (async () => {
      if (rvMessage.author === "00000000000000000000000000") {
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
        author: authorInfo ? authorInfo.discord : discordMessage.author,
      },
    };
  }

  async getMessage(channel: string, id: string) {
    const rvMessage = await this.rvAPI.get(`/channels/${channel}/messages/${id}`) as API.Message;

    return this.convertMessageObj(rvMessage);
  }

  async sendMessage(channel: string, data: API.DataMessageSend) {
    const revoltResponse = await this.rvAPI.post(
      `/channels/${channel}/messages`,
      data,
    ) as API.Message;

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

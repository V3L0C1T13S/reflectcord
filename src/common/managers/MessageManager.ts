import { RESTPostAPIChannelMessageJSONBody } from "discord.js";
import { API } from "revolt.js";
import { Message, MessageSendData, User } from "../models";
import { BaseManager } from "./BaseManager";

export class MessageManager extends BaseManager {
  async getMessage(channel: string, id: string) {
    const rvMessage = await this.rvAPI.get(`/channels/${channel}/messages/${id}`) as API.Message;
    const authorInfo = !rvMessage.system
      ? await this.apiWrapper.users.getUser(rvMessage.author)
      : null;

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
}

import { RESTPostAPIChannelMessageJSONBody } from "discord.js";
import { API } from "revolt.js";
import { Message, MessageSendData, User } from "../models";
import { BaseManager } from "./BaseManager";

export class MessageManager extends BaseManager {
  async getMessage(channel: string, id: string) {
    const rvMessage = await this.rvAPI.get(`/channels/${channel}/messages/${id}`) as API.Message;
    const authorInfo = !rvMessage.system ? await this.rvAPI.get(`/users/${rvMessage.author}`) as API.User : null;

    const discordMessage = await Message.from_quark(rvMessage);
    return {
      revolt: {
        message: rvMessage,
        author: authorInfo,
      },
      discord: {
        ...discordMessage,
        author: authorInfo ? await User.from_quark(authorInfo) : discordMessage.author,
      },
    };
  }

  async sendMessage(channel: string, data: RESTPostAPIChannelMessageJSONBody) {
    const revoltResponse = await this.rvAPI.post(
      `/channels/${channel}/messages`,
      await MessageSendData.to_quark(data),
    ) as API.Message;

    const discordMessage = await Message.from_quark(revoltResponse);

    return {
      revolt: {
        message: revoltResponse,
      },
      discord: {
        ...discordMessage,
      },
    };
  }
}

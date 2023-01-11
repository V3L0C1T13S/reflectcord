/* eslint-disable camelcase */
import { Request } from "express";
import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";
import { fromSnowflake, Message } from "@reflectcord/common/models";

export interface Message_reference {
  guild_id: string;
  channel_id: string;
  message_id: string;
}

export interface GreetUserBody {
  sticker_ids: string[];
  message_reference: Message_reference;
}

export default () => <Resource> {
  post: async (req: Request<any, any, GreetUserBody>, res) => {
    const { channel_id } = req.params;
    if (!channel_id) throw new HTTPError("Maformed request", 244);

    const rvId = await fromSnowflake(channel_id);

    const msg = await res.rvAPIWrapper.messages.sendMessage(rvId, {
      content: ":wave:",
      replies: req.body.message_reference ? [{
        id: await fromSnowflake(req.body.message_reference.message_id),
        mention: true,
      }] : null,
    });

    res.json(msg.discord);
  },
};

import { APIChannel } from "discord.js";
import { Application, Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { fromSnowflake } from "../../../../common/models/util";
import { HTTPError } from "../../../../common/utils";
import { Channel } from "../../../../common/models";

export type dmChannelReq = {
  recipients: string[],
}

export default (express: Application) => <Resource> {
  get: async (req, res: Response<APIChannel[]>) => {
    const rvDms = await res.rvAPI.get("/users/dms") as API.Channel[];

    const discordDMS = await Promise.all(rvDms
      .map((channel) => Channel.from_quark(channel)));

    return res.json(discordDMS);
  },
  post: async (req: Request<any, any, dmChannelReq>, res) => {
    const { recipients } = req.body;
    if (recipients.length > 1) throw new HTTPError("Only single-user dms are supported.", 244);

    const user = recipients[0];
    if (!user) throw new HTTPError("Must dm at least one user", 244);

    const userId = await fromSnowflake(user);
    const channel = await res.rvAPI.get(`/users/${userId}/dm`) as API.Channel;

    res.json(await Channel.from_quark(channel));
  },
};

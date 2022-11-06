/* eslint-disable camelcase */
import { APIChannel } from "discord.js";
import { Application, Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { fromSnowflake } from "../../../../common/models/util";
import { HTTPError } from "../../../../common/utils";
import { Channel } from "../../../../common/models";

export type dmChannelReq = {
  name?: string,
  recipients?: string[],
  recipient_id?: string,
}

export default (express: Application) => <Resource> {
  get: async (req, res: Response<APIChannel[]>) => {
    const rvDms = await res.rvAPI.get("/users/dms") as API.Channel[];

    const discordDMS = await Promise.all(rvDms
      .map((channel) => Channel.from_quark(channel)));

    return res.json(discordDMS);
  },
  post: async (req: Request<any, any, dmChannelReq>, res) => {
    const { recipients, recipient_id } = req.body;

    if (!recipient_id && !recipients) throw new HTTPError("Malformed request", 244);

    const user = recipient_id ?? recipients?.[0] ?? null;
    if (!user) throw new HTTPError("Must dm at least one user", 244);

    const userId = await fromSnowflake(user);
    const selfId = await res.rvAPIWrapper.users.getSelfId();
    const channel = await res.rvAPI.get(`/users/${userId as ""}/dm`);

    res.json(await Channel.from_quark(channel, { excludedUser: selfId }));
  },
};

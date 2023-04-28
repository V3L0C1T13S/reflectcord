/* eslint-disable camelcase */
import { APIChannel } from "discord.js";
import { Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { fromSnowflake, Channel } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";

export type dmChannelReq = {
  name?: string,
  recipients?: string[],
  recipient_id?: string,
}

export default () => <Resource> {
  get: async (req, res: Response<APIChannel[]>) => {
    const dms = await res.rvAPIWrapper.channels.fetchDmChannels();

    res.json(dms.map((x) => x.discord));
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

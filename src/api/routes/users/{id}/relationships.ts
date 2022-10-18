/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable camelcase */
import { APIUser } from "discord.js";
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { UserRelations } from "../../../../common/sparkle";
import { fetchUser } from ".";
import { fromSnowflake } from "../../../../common/models/util";
import { HTTPError } from "../../../../common/utils";

export default (express: Application) => <Resource> {
  get: async (req, res: Response<UserRelations[]>) => {
    const { id } = req.params;
    if (!id) throw new HTTPError("ID is required.", 244);

    const rvId = await fromSnowflake(id);

    const rvMutuals = await res.rvAPI.get(`/users/${rvId}/mutual`) as API.MutualResponse;
    const users: APIUser[] = [];

    for (const x of rvMutuals.users) {
      const user = await fetchUser(res.rvAPI, x);
      users.push(user);
    }

    res.json(users.map((x) => ({
      id: x.id,
      username: x.username,
      avatar: x.avatar,
      discriminator: x.discriminator,
      public_flags: x.public_flags,
    })));
  },
};

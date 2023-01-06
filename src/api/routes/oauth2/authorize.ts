/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";
import { fromSnowflake, Application, User } from "@reflectcord/common/models";
import { systemUserID } from "@reflectcord/common/rvapi";

export default () => <Resource> {
  get: async (req, res) => {
    const { client_id } = req.query;

    if (typeof client_id !== "string") throw new HTTPError("Invalid params");

    const rvId = await fromSnowflake(client_id);

    const rvUser = await res.rvAPIWrapper.users.fetch(rvId);
    const discordApp = await Application.from_quark({
      _id: rvUser.revolt._id,
      owner: rvUser.revolt.bot?.owner ?? systemUserID,
      token: "",
      public: true,
    }, {
      user: rvUser.revolt,
    });

    const currentUser = await res.rvAPIWrapper.users.getSelf();
    const servers = await res.rvAPIWrapper.servers.getServers();

    res.json({
      application: discordApp,
      user: await User.from_quark(currentUser),
      authorized: false,
      bot: {
        ...rvUser.discord,
        approximate_guild_count: 0,
      },
      guilds: servers.map((x) => ({
        id: x.discord.id,
        name: x.discord.name,
        icon: x.discord.icon,
        mfa_level: x.discord.mfa_level,
        permissions: "4398046511103",
      })),
    });
  },
};

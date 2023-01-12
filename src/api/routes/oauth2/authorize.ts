/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { HTTPError, validate } from "@reflectcord/common/utils";
import { fromSnowflake, Application, User } from "@reflectcord/common/models";
import { systemUserID } from "@reflectcord/common/rvapi";
import { AuthorizePOSTSchema } from "@reflectcord/common/sparkle";

const precheckClientId = (id: any): id is string => typeof id === "string";

export default () => <Resource> {
  get: async (req, res) => {
    const { client_id } = req.query;

    if (!precheckClientId(client_id)) throw new HTTPError("Invalid params");

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
  post: {
    middleware: validate(AuthorizePOSTSchema),
    handler: async (req, res) => {
      const { client_id } = req.query;
      const { authorize, guild_id, permissions } = req.body as AuthorizePOSTSchema;

      if (!precheckClientId(client_id)) throw new HTTPError("Invalid params");

      const rvBotId = await fromSnowflake(client_id);
      const rvServer = await fromSnowflake(guild_id);
      await res.rvAPIWrapper.servers.inviteBot(rvServer, rvBotId);

      res.json({
        location: "/oauth2/authorized",
      });
    },
  },
};

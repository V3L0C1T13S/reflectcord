import { Resource } from "express-automatic-routes";
import { User } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";

export default () => <Resource> {
  get: async (req, res) => {
    const user = await res.rvAPIWrapper.users.fetchSelf();
    if (!user.revolt.bot) throw new HTTPError("Users cannot call this route.");

    // TODO: Cleanup into a quark_conversion method
    res.json({
      id: user.discord.id,
      name: user.discord.username,
      icon: user.discord.avatar,
      description: user.revolt.profile?.content ?? "",
      summary: "",
      type: null,
      cover_image: "",
      hook: true,
      bot_public: true,
      bot_require_code_grant: false,
      verify_key: "",
      owner: await User.from_quark({
        _id: user.revolt.bot.owner,
        username: "fixme",
        discriminator: "0001",
      }),
      flags: 0,
      team: null,
    });
  },
};

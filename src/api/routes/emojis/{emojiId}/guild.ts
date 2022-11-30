import { Resource } from "express-automatic-routes";
import { fromSnowflake, Guild } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";

export default () => <Resource> {
  get: async (req, res) => {
    const { emojiId } = req.params;
    if (!emojiId) throw new HTTPError("bad id");

    const rvEmojiId = await fromSnowflake(emojiId);

    const rvEmoji = await res.rvAPI.get(`/custom/emoji/${rvEmojiId as ""}`);

    if (rvEmoji.parent.type !== "Server") {
      res.sendStatus(404);
      return;
    }

    const rvServer = await res.rvAPI.get(`/servers/${rvEmoji.parent.id as ""}`);

    res.json(await Guild.from_quark(rvServer));
  },
};

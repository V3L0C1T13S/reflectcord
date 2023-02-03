import { Resource } from "express-automatic-routes";
import { fromSnowflake, Guild } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";
import { DiscoveryClient, systemUserID } from "@reflectcord/common/rvapi";

const client = new DiscoveryClient();

export default () => <Resource> {
  get: async (req, res) => {
    const { emojiId } = req.params;
    if (!emojiId) throw new HTTPError("bad id");

    const rvEmojiId = await fromSnowflake(emojiId);

    const rvEmoji = await res.rvAPI.get(`/custom/emoji/${rvEmojiId as ""}`);

    if (rvEmoji.parent.type !== "Server") {
      throw new HTTPError("Server does not exist or is private.", 404);
    }

    await client.init();

    const servers = await client.servers.fetchPopular();

    const rvServer = servers.pageProps.servers.find((server) => server._id === rvEmoji.parent.id);
    if (!rvServer) throw new HTTPError("Server does not exist or is private.", 404);

    res.json(await Guild.from_quark({
      ...rvServer,
      channels: [],
      owner: systemUserID,
      default_permissions: 0,
    }));
  },
};

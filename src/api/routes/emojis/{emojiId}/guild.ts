import { Resource } from "express-automatic-routes";
import { DiscoverableGuild, fromSnowflake } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";
import { DiscoveryClient } from "@reflectcord/common/rvapi";

const client = new DiscoveryClient();

export default () => <Resource> {
  get: async (req, res) => {
    const { emojiId } = req.params;
    if (!emojiId) throw new HTTPError("bad id");

    const rvEmojiId = await fromSnowflake(emojiId);

    const rvEmoji = await res.rvAPI.get(`/custom/emoji/${rvEmojiId as ""}`);

    if (rvEmoji.parent.type !== "Server") throw new HTTPError("Emoji is not a server emoji!");

    await client.init();

    const servers = await client.servers.fetchPopular();

    // @ts-ignore: WTF typescript?
    const rvServer = servers.pageProps.servers.find((server) => rvEmoji.parent.id === server._id);
    if (!rvServer) throw new HTTPError("Server does not exist or is private.", 404);

    res.json(await DiscoverableGuild.from_quark(rvServer));
  },
};

/* eslint-disable camelcase */
import { fromSnowflake } from "@reflectcord/common/models";
import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";
import { getEmojilibEmojis } from "@reflectcord/common/emojilib";
import { ChannelContainer } from "@reflectcord/common/managers";

export default () => <Resource> {
  get: async (req, res) => {
    const { guild_id } = req.params;

    if (!guild_id) throw new HTTPError("Invalid params", 422);

    const rvId = await fromSnowflake(guild_id);
    const server = await res.rvAPIWrapper.servers.fetch(rvId);
    const channels = (await Promise.all(server.revolt.channels
      .map((x) => res.rvAPIWrapper.channels.fetch(x).catch(() => {}))))
      .filter((x): x is ChannelContainer => !!x);

    const channelEmojis: Record<string, string> = {};

    channels.forEach((x) => {
      const keywords = x.discord.name!.split("-");
      const emojis = keywords.map((word) => getEmojilibEmojis(word)).flat();
      channelEmojis[x.discord.name!] = emojis[0] ?? "❓";
    });

    res.json(channelEmojis);
  },
};

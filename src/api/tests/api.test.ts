import { describe, expect, test } from "@jest/globals";
import axios from "axios";
import { ChannelType } from "discord.js";
import axiosRateLimit from "axios-rate-limit";
import { TestingToken } from "../../common/rvapi";
import {
  baseURL, TestChannelId, TestServerId, TestUserId,
} from "../../common/constants";

const apiURL = `${baseURL}/api`;

const isBot = TestingToken?.startsWith("Bot ");

const axiosClient = axiosRateLimit(axios.create({
  baseURL: apiURL,
}), {
  maxRequests: 3,
  perMilliseconds: 1000,
  maxRPS: 3,
});

async function getFromAPI(url: string) {
  const res = await axiosClient.get(`/${url}`, {
    headers: {
      authorization: TestingToken,
    },
  });

  console.log(JSON.stringify(res.data));

  return res;
}

async function postToAPI(url: string, data: any) {
  const res = await axiosClient({
    method: "post",
    url: `/${url}`,
    headers: {
      authorization: TestingToken,
    },
    data,
  });

  console.log(JSON.stringify(res.data));

  return res;
}

describe("api get requests", () => {
  test("user", async () => {
    const user = await getFromAPI(`users/${TestUserId}`);
    expect(user.data.id === TestUserId);
  });

  describe("self user data", () => {
    test("self public info", async () => {
      const user = await getFromAPI("users/@me");
      const profile = await getFromAPI("users/@me/profile");
      expect(user.data.id
        && profile.data
        && user.data.email && user.data.username);
    });
    test("private info", async () => {
      const channels = await getFromAPI("users/@me/channels");
      const guilds = await getFromAPI("users/@me/guilds");
      expect(Array.isArray(channels.data) && Array.isArray(guilds.data));
    });
    test("developer info", async () => {
      if (isBot) return;

      const bots = await getFromAPI("applications?with_team_applications=true");
      expect(bots.data);
    });
  });

  describe("guild tests", () => {
    axiosClient.setRateLimitOptions({
      maxRequests: 3,
      perMilliseconds: 1000,
      maxRPS: 3,
    });
    test("test guild", async () => {
      const guild = await getFromAPI(`guilds/${TestServerId}`);
      expect(guild.data.id === TestServerId);
    });

    test("members", async () => {
      const members = await getFromAPI(`guilds/${TestServerId}/members`);

      expect(Array.isArray(members.data));
    });

    test("bans", async () => {
      const bans = await getFromAPI(`guilds/${TestServerId}/bans`);

      expect(Array.isArray(bans.data));
    });

    test("emojis", async () => {
      const emojis = await getFromAPI(`guilds/${TestServerId}/emojis`);

      expect(Array.isArray(emojis.data));
    });

    test("roles", async () => {
      const roles = await getFromAPI(`guilds/${TestServerId}/roles`);

      expect(Array.isArray(roles.data));
    });

    test("stickers", async () => {
      const stickers = await getFromAPI(`guilds/${TestServerId}/stickers`);

      expect(Array.isArray(stickers.data));
    });

    test("home features", async () => {
      const guildFeed = await getFromAPI(`guilds/${TestServerId}/guild-feed`);

      expect(Array.isArray(guildFeed.data.results?.items));
    });

    test("threads", async () => {
      const searchThreads = await getFromAPI(`guilds/${TestServerId}/channels/${TestChannelId}/threads/search`);
      const activeThreads = await getFromAPI(`guilds/${TestServerId}/channels/${TestChannelId}/active`);

      expect(searchThreads.data).toBeInstanceOf(Array);
      expect(activeThreads.data).toBeInstanceOf(Array);
    });
  });

  describe("discovery", () => {
    test("categories", async () => {
      const categories = await getFromAPI("discovery/categories");
      expect(Array.isArray(categories.data));
    });
    test("recommended guilds", async () => {
      const guilds = await getFromAPI("guild-recommendations");

      expect(
        Array.isArray(guilds.data.recommended_guilds)
        && typeof guilds.data.load_id === "string",
      );
    });
  });

  axiosClient.setRateLimitOptions({
    maxRequests: 1,
    perMilliseconds: 1000,
    maxRPS: 1,
  });
  test("text channel", async () => {
    const textChannel = await getFromAPI(`channels/${TestChannelId}`);
    expect(
      textChannel.data.id === TestChannelId
      && textChannel.data.type === ChannelType.GuildText
      && textChannel.data.guild_id === TestServerId,
    );
  });

  test("gateway", async () => {
    const gatewayRes = await getFromAPI("gateway");
    const gatewayBot = await getFromAPI("gateway/bot");

    expect(
      gatewayRes.data.url === "ws://localhost:3002"
      && gatewayBot.data.url === "ws://localhost:3002"
      && gatewayBot.data.shard,
    );
  });

  describe("gifs", () => {
    test("trending", async () => {
      const trendingGifs = await getFromAPI("gifs/trending");

      expect(
        Array.isArray(trendingGifs.data.categories)
      && Array.isArray(trendingGifs.data.gifs),
      );
    });
  });
});

describe("api post requests", () => {
  test("post message", async () => {
    await postToAPI(`channels/${TestChannelId}/messages`, {
      content: "Hello World!",
    });
  });

  describe("misc requests", () => {
    test("track via science", async () => {
      const res = await postToAPI("science", {
        events: [{
          properties: {
            client_send_timestamp: Date.now(),
            client_track_timestamp: Date.now(),
            client_uuid: "AAAAAAAAAAAAAAAAAAAAAAAAAA00AAWX",
            has_session: true,
            page_name: "applications",
            previous_link_location: null,
            previous_page_name: null,
          },
          type: "test_case",
        }],
      });

      expect(res.status === 204);
    });
  });
});

describe("reflectcord get requests", () => {
  test("ping", async () => {
    const ping = await getFromAPI("ping");
    expect(ping.data.ping === "pong!");
  });
});

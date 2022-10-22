import { describe, expect, test } from "@jest/globals";
import axios from "axios";
import { ChannelType } from "discord.js";
import { TestingToken } from "../../common/rvapi";
import {
  baseURL, TestChannelId, TestServerId, TestUserId,
} from "../../common/constants";

const apiURL = `${baseURL}/api`;

async function getFromAPI(url: string) {
  const res = await axios.get(`${apiURL}/${url}`, {
    headers: {
      authorization: TestingToken,
    },
  });

  console.log(JSON.stringify(res.data));

  return res;
}

async function postToAPI(url: string, data: any) {
  const res = await axios({
    method: "post",
    url: `${apiURL}/${url}`,
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
      expect(channels.data && guilds.data);
    });
    test("developer info", async () => {
      // Bots cant do this, so we can just skip it.
      if (TestingToken?.startsWith("Bot ")) return;

      const bots = await getFromAPI("applications?with_team_applications=true");
      expect(bots.data);
    });
  });

  test("guild", async () => {
    const guild = await getFromAPI(`guilds/${TestServerId}`);
    expect(guild.data.id === TestServerId);
  });

  test("text channel", async () => {
    const textChannel = await getFromAPI(`channels/${TestChannelId}`);
    expect(textChannel.data.id === TestChannelId
      && textChannel.data.type === ChannelType.GuildText);
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

import { describe, expect, test } from "@jest/globals";
import axios from "axios";
import { ChannelType } from "discord.js";
import { TestingToken } from "../../common/rvapi";
import { baseURL } from "../../common/constants";

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

// Make these things that you own, otherwise you'll get errors
const testUserId = "01FT2S6N2MZPQ83FWTF00AEVVH";
const testGuildId = "01FVHTJF0Q30ZJB8F77GXRTK4M";
const testTextChannelId = "01FVHTJF0QC3GT3XM82M6EWF26";

describe("api get requests", () => {
  test("user", async () => {
    const user = await getFromAPI(`users/${testUserId}`);
    expect(user.data.id === testUserId);
  });

  describe("self user data", () => {
    test("self public info", async () => {
      const user = await getFromAPI("users/@me");
      const profile = await getFromAPI("users/@me/profile");
      expect(user.data.id && profile.data);
    });
    test("private info", async () => {
      const channels = await getFromAPI("users/@me/channels");
      const guilds = await getFromAPI("users/@me/guilds");
      expect(channels.data && guilds.data);
    });
    test("developer info", async () => {
      const bots = await getFromAPI("applications?with_team_applications=true");
      expect(bots.data);
    });
  });

  test("guild", async () => {
    const guild = await getFromAPI(`guilds/${testGuildId}`);
    expect(guild.data.id === testGuildId);
  });

  test("text channel", async () => {
    const textChannel = await getFromAPI(`channels/${testTextChannelId}`);
    expect(textChannel.data.id === testTextChannelId
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
    await postToAPI(`channels/${testTextChannelId}/messages`, {
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
            client_uuid: "AAAAAAAAAAA0PJAiaVet34MBAAAAAAAA",
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

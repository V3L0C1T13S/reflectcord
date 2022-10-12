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

const testUserId = "01FT2S6N2MZPQ83FWTF00AEVVH";
const testGuildId = "01FVHTJF0Q30ZJB8F77GXRTK4M";
const testTextChannelId = "01FVHTJF0QC3GT3XM82M6EWF26";

describe("api get requests", () => {
  test("user", async () => {
    const user = await getFromAPI(`users/${testUserId}`);
    expect(user.data.id === testUserId);
  });

  test("self user data", async () => {
    const user = await getFromAPI("users/@me");
    const profile = await getFromAPI("users/@me/profile");
    const channels = await getFromAPI("users/@me/channels");
    expect(user.data.id && profile.data && channels.data);
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

describe("reflectcord get requests", () => {
  test("ping", async () => {
    const ping = await getFromAPI("ping");
    expect(ping.data.ping === "pong!");
  });
});

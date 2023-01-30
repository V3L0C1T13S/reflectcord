import { describe, test, expect } from "@jest/globals";
import { getFromAPI } from "@reflectcord/common/utils/testUtils";

describe("self info (/users/@me)", () => {
  test("get self guilds", async () => {
    const guilds = await getFromAPI("users/@me/guilds");

    expect(guilds.data).toBeInstanceOf(Array);
  });
  test("get dm channels", async () => {
    const channels = await getFromAPI("users/@me/channels");

    expect(channels.data).toBeInstanceOf(Array);
  });
});

import { describe, expect, test } from "@jest/globals";
import { getFromAPI } from "@reflectcord/common/utils/testUtils";
import { TestServerId } from "@reflectcord/common/constants";

describe("/guilds", () => {
  describe("/{guild_id}", () => {
    test("/", async () => {
      const guild = await getFromAPI(`guilds/${TestServerId}`);

      expect(typeof guild.data.id === "string");
    });
    test("/channels", async () => {
      const channels = await getFromAPI(`guilds/${TestServerId}/channels`);

      expect(channels.data).toBeInstanceOf(Array);
    });
  });
});

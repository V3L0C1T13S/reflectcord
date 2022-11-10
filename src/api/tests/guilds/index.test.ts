import { describe, expect, test } from "@jest/globals";
import { getFromAPI } from "../../../common/utils/testUtils";
import { TestServerId } from "../../../common/constants";

describe("/guilds", () => {
  describe("/{guild_id}", () => {
    test("/channels", async () => {
      const channels = await getFromAPI(`guilds/${TestServerId}/channels`);

      expect(channels.data).toBeInstanceOf(Array);
    });
  });
});

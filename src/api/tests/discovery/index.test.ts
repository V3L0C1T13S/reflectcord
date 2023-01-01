import { describe, expect, test } from "@jest/globals";
import { getFromAPI } from "@reflectcord/common/utils/testUtils";

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

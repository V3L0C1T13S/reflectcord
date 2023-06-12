import { describe, test, expect } from "@jest/globals";
import { getFromAPI } from "@reflectcord/common/utils/testUtils";
import { TestChannelId } from "@reflectcord/common/constants";

describe("typing (/channels/:id/webhooks)", () => {
  test("get channel webhooks", async () => {
    const res = await getFromAPI(`channels/${TestChannelId}/webhooks`);

    expect(res.data).toBeInstanceOf(Array);
  });
});

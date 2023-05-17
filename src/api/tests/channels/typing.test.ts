import { describe, test, expect } from "@jest/globals";
import { HttpStatusCode } from "axios";
import { postToAPI } from "@reflectcord/common/utils/testUtils";
import { TestChannelId } from "@reflectcord/common/constants";

describe("typing (/channels/:id/typing)", () => {
  test("start typing in test channel", async () => {
    const res = await postToAPI(`channels/${TestChannelId}/typing`);

    expect(res.status).toBe(HttpStatusCode.NoContent);
  });
});

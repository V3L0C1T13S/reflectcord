import { describe, expect, test } from "@jest/globals";
import { deleteFromAPI, getFromAPI, postToAPI } from "@reflectcord/common/utils/testUtils";
import { TestServerId } from "@reflectcord/common/constants";

describe("/guilds/{guild_id}/roles", () => {
  test("get all roles", async () => {
    const roles = await getFromAPI(`guilds/${TestServerId}/roles`);

    expect(roles.data).toBeInstanceOf(Array);
  });
  test("create role (and get it)", async () => {
    const role = (await postToAPI(`guilds/${TestServerId}/roles`, {
      name: "test role",
    })).data;

    const roleGET = (await getFromAPI(`guilds/${TestServerId}/roles/${role.id}`)).data;

    expect(typeof role.id === "string");
    expect(role.id === roleGET.id);
  });
});

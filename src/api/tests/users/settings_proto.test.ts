import { describe, test, expect } from "@jest/globals";
import { getFromAPI } from "@reflectcord/common/utils/testUtils";
import { SettingsType } from "@reflectcord/common/sparkle";

describe("/users/@me/settings-proto", () => {
  test("GET", async () => {
    const userSettings = await getFromAPI(`users/@me/settings-proto/${SettingsType.UserSettings}`);
    const frecencySettings = await getFromAPI(`users/@me/settings-proto/${SettingsType.FrecencyUserSettings}`);

    expect(userSettings.data).toBeInstanceOf(String);
    expect(frecencySettings.data).toBeInstanceOf(String);
  });
});

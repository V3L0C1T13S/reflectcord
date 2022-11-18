import { internalStatus, Status } from "@reflectcord/common/models";
import { Payload } from "../util";
import { WebSocket } from "../Socket";

export async function presenceUpdate(this: WebSocket, data: Payload<internalStatus>) {
  if (!data.d) return;

  const presence = data.d;

  const activity = presence.activities?.[0];

  await this.rvAPI.patch("/users/@me", {
    status: await Status.to_quark(presence) ?? null,
    profile: activity ? await (async () => {
      const userId = await this.rvAPIWrapper.users.getSelfId();
      const currentProfile = await this.rvAPI.get(`/users/${userId as ""}/profile`);

      const statePfx = "__";

      return {
        content: activity.state
          ? `${statePfx} Rich Presence
          --------------------------------------------
          **${activity.assets?.large_text}**
          **${activity.assets?.small_text}**
          ${activity.state}
          ${activity.details}
          <t:${activity.timestamps?.start}:t> elapsed
          ${activity.buttons?.map((x, i) => `[${x}](${activity.metadata?.button_urls?.[i]})`)}
          -------------------------------------------- ${statePfx}
          ${currentProfile.content?.split(statePfx).pop()?.split(statePfx).pop()}
          `
          : currentProfile.content ?? null,
      };
    })() : null,
  });
}

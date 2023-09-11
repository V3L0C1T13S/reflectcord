import { internalActivity, internalStatus, Status } from "@reflectcord/common/models";
import { ActivityType } from "discord.js";
import { API } from "revolt.js";
import { Payload } from "../util";
import { WebSocket } from "../Socket";

const richPresenceRegex = /__RPC(\d+)/g;

const statePfx = "__RPC000";

class RichPresence {
  largeText?: string | undefined;
  smallText?: string;

  static fromString(presence: string) {
    const begin = presence.split(statePfx).pop()?.split(statePfx)?.[0];
    if (!begin) throw new Error(`bad presence string, ${presence}`);
  }

  static toString() {

  }
}

// TODO: move into rvapi
export async function updatePresence(this: WebSocket, presence: internalStatus) {
  const activity = presence.activities?.[0];

  const remove: API.FieldsUser[] = [];
  const body: API.DataEditUser = {
    status: await Status.to_quark(presence) ?? null,
    profile: activity && activity.type !== ActivityType.Custom ? await (async () => {
      const userId = await this.rvAPIWrapper.users.getSelfId();
      const currentProfile = await this.rvAPI.get(`/users/${userId as ""}/profile`);

      return {
        content: activity.state
          ? `${statePfx} Rich Presence
          --------------------------------------------
          **${activity.assets?.large_text}**
          **${activity.assets?.small_text}**
          ${activity.state}
          ${activity.details}
          <t:${activity.timestamps?.start}:R> elapsed
          Playing since <t:${activity.created_at ?? Date.nowSeconds()}:R>
          ${activity.buttons?.map((x, i) => `[${x}](${activity.metadata?.button_urls?.[i]})`)}
          -------------------------------------------- ${statePfx}
          ${currentProfile.content?.split(statePfx).pop()?.split(statePfx).pop()}
          `
          : currentProfile.content ?? null,
      };
    })() : null,
  };

  if (!activity) {
    remove.push("StatusText");
  }

  // HACK: Workaround for revolt erroring out if remove & fields are present
  if (remove.length > 0) {
    await this.rvAPI.patch("/users/@me", {
      remove,
    });
  }

  await this.rvAPI.patch("/users/@me", body);
}

export async function presenceUpdate(this: WebSocket, data: Payload<internalStatus>) {
  if (!data.d) return;

  const presence = data.d;

  await updatePresence.call(this, presence);
}

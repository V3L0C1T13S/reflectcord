import {
  APIUser,
  GatewayActivity,
  GatewayPresenceClientStatus,
  PresenceUpdateReceiveStatus,
} from "discord.js";
import { GatewayFullUserPresence, internalStatus } from "./user";

export interface RevoltPresenceData {
  user: APIUser,
  server?: string,
  guild_id?: string,
  deduplicate?: boolean,
  status: internalStatus,
}

// TODO
export class ReadyMergedPresenceDTO implements GatewayFullUserPresence {
  status?: PresenceUpdateReceiveStatus;
  activities: GatewayActivity[];
  since?: number;
  afk?: boolean;
  user_id?: string;
  user?: Partial<APIUser> & Pick<APIUser, "id">;
  client_status?: GatewayPresenceClientStatus;
  last_modified?: number;
  guild_id?: string;

  constructor(data: RevoltPresenceData) {
    this.activities = [];
    this.last_modified = Date.now();

    if (data.deduplicate) this.user_id = data.user.id;
    else this.user = data.user;
  }
}

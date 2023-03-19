import { Logger } from "@reflectcord/common/utils";
import { ClientInfo, GatewaySession, Session } from "../../sparkle";
import { internalActivity } from "./user";

export class GatewaySessionDTO implements GatewaySession {
  activities: internalActivity[];
  client_info: ClientInfo;
  session_id: string;
  status: string;
  active?: boolean;

  constructor(session: Session) {
    this.session_id = session.session_id;
    this.activities = session.activities;
    this.client_info = session.client_info;
    this.status = session.status;
    this.active = true;
  }

  toJSON() {
    const data: GatewaySession = {
      session_id: this.session_id,
      activities: this.activities,
      client_info: this.client_info,
      status: this.status,
    };

    if (this.active !== undefined) data.active = this.active;

    return data;
  }
}

export function identifyClient(browser: string) {
  switch (browser) {
    case "Discord Client": {
      return "desktop";
    }
    default: {
      Logger.log(`Unknown browser ${browser}. Returning web`);
      return "web";
    }
  }
}

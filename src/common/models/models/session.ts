import { Session } from "../../sparkle";

export class GatewaySessionDTO {
  session: Session;
  active?: boolean;

  constructor(session: Session) {
    this.session = session;
    this.active = true;
  }

  toJSON() {
    const json: any = {
      ...this.session,
    };

    if (this.active !== undefined) json.active = this.active;

    return json;
  }
}

export function identifyClient(browser: string) {
  switch (browser) {
    case "Discord Client": {
      return "desktop";
    }
    default: {
      return "web";
    }
  }
}

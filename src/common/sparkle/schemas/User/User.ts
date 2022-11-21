import { RESTPatchAPICurrentUserJSONBody } from "discord.js";

export interface PatchCurrentUserBody extends RESTPatchAPICurrentUserJSONBody {
  /** Modifies the users banner if passed */
  banner?: string | null,
  /** Modifies users bio if passed */
  bio?: string,
}

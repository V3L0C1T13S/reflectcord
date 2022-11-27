import { RESTPatchAPICurrentUserJSONBody } from "discord.js";

export interface PatchCurrentUserBody extends RESTPatchAPICurrentUserJSONBody {
  /** Modifies the users banner if passed */
  banner?: string | null,
  /** Modifies users bio if passed */
  bio?: string,
}

export interface PatchCurrentAccountBody extends RESTPatchAPICurrentUserJSONBody {
  password?: string,
  new_password?: string,
  email?: string,
}

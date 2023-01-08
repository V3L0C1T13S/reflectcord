/* eslint-disable no-redeclare */
export const AuthorizePOSTSchema = {
  authorize: Boolean,
  guild_id: String,
  permissions: String,
};

export interface AuthorizePOSTSchema {
  authorize: boolean,
  guild_id: string,
  permissions: string,
}

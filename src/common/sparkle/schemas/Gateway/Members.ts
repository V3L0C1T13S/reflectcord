import { APIGuildMember, APIRole } from "discord.js";

/**
 * Merged members are simple objects that tell clients with
 * deduplication capabilities basic info about someone in a server.
 *
 * Unlike normal members, MergedMembers do not have User objects as
 * Discord clients support finding out what user they are just from
 * the user_id field.
*/
export interface MergedMember extends Omit<APIGuildMember, "user"> {
  /**
   * Highest hoisted role this user has
  */
  hoisted_role?: APIRole;
  /**
   * The members user ID
  */
  user_id: string;
}

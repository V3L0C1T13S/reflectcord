import { APIGuildMember, APIRole } from "discord.js";

export interface MergedMember extends APIGuildMember {
  /**
   * Highest hoisted role this user has
  */
  hoisted_role?: APIRole;
  /**
   * The members user ID
  */
  user_id: string;
}

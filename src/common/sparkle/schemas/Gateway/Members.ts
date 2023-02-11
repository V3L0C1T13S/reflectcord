import { APIGuildMember, APIRole } from "discord.js";

export interface MergedMember extends APIGuildMember {
  /**
   * Highest hoisted role this user has
  */
  hoisted_role?: APIRole,
}

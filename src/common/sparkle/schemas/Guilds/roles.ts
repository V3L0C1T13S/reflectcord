/**
 * Array of member IDs that have a given role
 *
 * GET /guilds/{id}/roles/{id}/member-ids
 */
export type MemberIdsResponse = string[]

/**
 * A record sent in response to /guilds/{id}/roles/member-counts
 *
 * The keys are role IDs, and the corresponding values are the
 * amount of members that have a given role.
 */
export type MemberCountsResponse = Record<string, number>;

export const APIGuildRoleMembersPATCHBody = {
  member_ids: [String],
};

/**
 * Gets sent in response to GET /guilds/{id}/roles/{id}/member-ids
 */
export type MemberIdsResponse = string[]

export type MemberCountsResponse = Record<string, number>;

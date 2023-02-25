import { API } from "revolt.js";

export function getServerRoles(roles: Record<string, API.Role>, ids: string[]) {
  return Object.entries(roles).filter(([id]) => ids.includes(id))
    .map(([_, role]) => role);
}

export const sortRolesByRank = (r1: API.Role, r2: API.Role) => (r1.rank ?? 0) - (r2.rank ?? 0);

export function sortMemberRoles(member: API.Member, server: API.Server) {
  return member.roles
    ?.map((r) => server.roles?.[r])
    .filter((r) => r)
    .sort((a, b) => b!.rank! - a!.rank!);
}

export function getHoistedRole(member: API.Member, server: API.Server) {
  return sortMemberRoles(member, server)?.filter((r) => r?.hoist).slice(-1)[0] ?? null;
}

export const sortMembersByHighestRole = (m1: API.Member, m2: API.Member, roles: API.Server["roles"]) => {

};

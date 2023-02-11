import { API } from "revolt.js";

export function getServerRoles(roles: Record<string, API.Role>, ids: string[]) {
  return Object.entries(roles).filter(([id]) => ids.includes(id))
    .map(([_, role]) => role);
}

export const sortRolesByRank = (r1: API.Role, r2: API.Role) => (r1.rank ?? 0) - (r2.rank ?? 0);

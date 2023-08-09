import { API } from "revolt.js";

export function getServerRoles(roles: Record<string, API.Role>, ids: string[]) {
  return Object.entries(roles).filter(([id]) => ids.includes(id))
    .map(([_, role]) => role);
}

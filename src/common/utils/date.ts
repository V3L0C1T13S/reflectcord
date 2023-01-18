/**
 * Imitates Discords ISO strings
 *
 * Thanks python for not following standards!
*/
export function toCompatibleISO(iso: string) {
  return iso.replace("Z", "+00:00");
}

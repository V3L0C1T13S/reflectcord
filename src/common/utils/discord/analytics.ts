import { genRanHex } from "./session";

/**
 * @summary Discord analytics tokens are composed of two main parts:
 * A User ID in Base64,
 * and then random gibberish that is supposedly valid Base64.
 * @param userId The user id to encode
 * @returns A new analytics token
*/
export function genAnalyticsToken(userId: string) {
  return Buffer.from(`${userId}${genRanHex(18)}`, "utf-8").toString("base64");
}

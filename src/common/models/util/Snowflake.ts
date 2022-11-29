import { Snowflake } from "nodejs-snowflake";
import ulid, { decodeTime } from "ulid";
import { discordEpoch } from "../../constants";
import { DbManager } from "../../db";

export type snowflakeConversionData = {
  snowflake: string;
  ulid: string;
}

export const snowflakes = DbManager.client.db("reflectcord")
  .collection<snowflakeConversionData>("converted_snowflakes");

/**
 * Converts a ULID to snowflake and stores the original ULID in a db
 * for later recovery.
*/
export async function toSnowflake(id: string) {
  const existing = await snowflakes.findOne({
    ulid: id,
  });
  if (existing) return existing.snowflake;

  const time = decodeTime(id);
  const uid = new Snowflake({
    custom_epoch: parseInt(discordEpoch, 10),
  });
  const convertedId = uid.idFromTimestamp(time);

  await snowflakes.insertOne({
    ulid: id,
    snowflake: convertedId.toString(),
  });

  return convertedId.toString();
}

/**
 * @returns A snowflake from the DB or null if not found.
*/
export async function fromSnowflake(id: string) {
  const existing = await snowflakes.findOne({
    snowflake: id,
  });

  if (!existing) throw new Error("Non-existent ID");

  return existing.ulid;
}

/**
 * Only use on stuff that is either user-generted,
 * or generally unreliable.
 * @returns A snowflake if successful, original id if not.
*/
export async function tryToSnowflake(id: string) {
  try {
    const res = await toSnowflake(id);
    return res;
  } catch {
    return id;
  }
}

export async function tryFromSnowflake(id: string) {
  try {
    const res = await fromSnowflake(id);
    return res;
  } catch {
    return id;
  }
}

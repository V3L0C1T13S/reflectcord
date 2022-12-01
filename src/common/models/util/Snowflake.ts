import { Snowflake } from "nodejs-snowflake";
import ulid, { decodeTime } from "ulid";
import { discordEpoch } from "../../constants";
import { DbManager } from "../../db";

export type snowflakeConversionData = {
  snowflake: string;
  _id: string;
}

export const snowflakes = DbManager.client.db("reflectcord")
  .collection<snowflakeConversionData>("converted_snowflakes");

/**
 * Converts a ULID to snowflake and stores the original ULID in a db
 * for later recovery.
*/
export async function toSnowflake(id: string) {
  const sfData = await snowflakes.findOneAndUpdate({
    _id: id,
  }, {
    $setOnInsert: {
      _id: id,
      snowflake: new Snowflake({
        custom_epoch: parseInt(discordEpoch, 10),
      }).idFromTimestamp(decodeTime(id)).toString(),
    },
  }, { upsert: true, returnDocument: "after" });

  if (!sfData.value) throw new Error("SF Conversion failed");

  return sfData.value?.snowflake;
}

/**
 * @returns A snowflake from the DB or null if not found.
*/
export async function fromSnowflake(id: string) {
  const existing = await snowflakes.findOne({
    snowflake: id,
  });

  if (!existing) throw new Error("Non-existent ID");

  return existing._id;
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

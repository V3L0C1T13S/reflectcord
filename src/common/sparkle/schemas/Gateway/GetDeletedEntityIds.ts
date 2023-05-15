export interface GetDeletedEntityIdsSchema {
  guild_id: string,
  channels_id_hash: string,
  role_ids_hash: string,
  emoji_ids_hash: string,
  sticker_ids_hash: string,
}

// eslint-disable-next-line no-redeclare
export const GetDeletedEntityIdsSchema = {
  guild_id: String,
  channels_id_hash: String,
  role_ids_hash: String,
  emoji_ids_hash: String,
  sticker_ids_hash: String,
};

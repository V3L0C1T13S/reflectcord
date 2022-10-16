import ulid from "ulid";

export function toSnowflake(id: string) {
  return ulid.decodeTime(id);
}

export function fromSnowflake(id: string) {
  // FIXME
}

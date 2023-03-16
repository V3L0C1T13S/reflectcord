export interface ReadStateObject {
  id: string,
  last_message_id: string | null,
  last_pin_timestamp: string | null,
  mention_count: number,
}

export interface ReadStateObject {
  id: string,
  last_message_id: string | null,
  last_pin_timestamp: string | null,
  mention_count: number,
}

export interface NonChannelReadState {
  /**
   * TODO: Document
   *
   * Known types:
   * 2
  */
  read_state_type: number,
  last_acked_id: string,
  id: string,
  badge_count: number,
}

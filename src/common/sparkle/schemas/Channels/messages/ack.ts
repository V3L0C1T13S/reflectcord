export interface AckRequest {
  channel_id: string,
  message_id: string,
}

export interface AckBulkBody {
  read_states: AckRequest[],
}

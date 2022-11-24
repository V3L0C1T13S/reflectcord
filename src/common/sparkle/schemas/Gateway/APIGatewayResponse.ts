export interface APIGatewayResponse {
  url: string
}

export interface APIGatewayBotResponse extends APIGatewayResponse {
  shards: number;
  session_start_limit: {
    total: number;
    remaining: number;
    reset_after: number;
    max_concurrency: number;
  };
}

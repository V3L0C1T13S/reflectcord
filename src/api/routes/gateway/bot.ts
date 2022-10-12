import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";

export interface GatewayBotResponse {
  url: string;
  shards: number;
  session_start_limit: {
    total: number;
    remaining: number;
    reset_after: number;
    max_concurrency: number;
  };
}

export default (express: Application) => <Resource> {
  get: (req, res: Response<GatewayBotResponse>) => {
    console.log("Received request for gateway");
    res.json({
      url: "ws://localhost:3002",
      shards: 1,
      session_start_limit: {
        total: 1000,
        remaining: 999,
        reset_after: 14400000,
        max_concurrency: 1,
      },
    });
  },
};

import { NextFunction, Request, Response } from "express";
import { getIpAddress } from "@reflectcord/common/utils";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { API_PREFIX_TRAILING_SLASH } from "./Auth";

const opts = {
  points: 6, // 6 points
  duration: 1, // Per second
};

const rateLimiter = new RateLimiterMemory(opts);

export function rateLimit() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const bucketId = req.originalUrl.replace(API_PREFIX_TRAILING_SLASH, "");
    const executorId = getIpAddress(req);

    const offender = executorId + bucketId;

    rateLimiter.consume(offender, 2)
      .then(() => {
        next();
      })
      .catch(() => {
        res.status(429)
          .set("X-RateLimit-Limit", "6");
      });
  };
}

import { NextFunction, Request, Response } from "express";
import { getIpAddress } from "@reflectcord/common/utils";
import { RateLimiterMemory } from "rate-limiter-flexible";

type RatelimitRoute = {
  limit: number,
  path: string,
}

const routes: RatelimitRoute[] = [
  {
    limit: 20,
    path: "/users",
  },
  {
    limit: 10,
    path: "/bots",
  },
  {
    limit: 15,
    path: "/channels",
  },
  {
    limit: 3,
    path: "/auth",
  },
];

const limiters:{ route: RatelimitRoute, limiter: RateLimiterMemory }[] = routes
  .map((x) => ({
    limiter: new RateLimiterMemory({
      points: x.limit,
      duration: 10,
    }),
    route: x,
  }));

export function rateLimit() {
  return async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.path);
    const rateLimiter = limiters.find((x) => req.path.startsWith(x.route.path));
    if (!rateLimiter) {
      console.log(`no limiter for ${req.path}`);
      return next();
    }
    const executorId = getIpAddress(req);

    const offender = executorId + rateLimiter.route.path;
    const current = (await rateLimiter.limiter.get(offender));

    res.set("X-RateLimit-Limit", rateLimiter.route.limit.toString());
    res.set("X-RateLimit-Remaining", current?.remainingPoints.toString() ?? rateLimiter.route.limit.toString());
    res.set("X-RateLimit-Reset", rateLimiter.limiter.msDuration.toString());
    res.set("X-RateLimit-Reset-After", rateLimiter.limiter.duration.toString());
    res.set("X-RateLimit-Bucket", rateLimiter.route.path);

    rateLimiter.limiter.consume(offender, 1)
      .then(() => {
        next();
      })
      .catch(() => {
        res.status(429)
          .set("X-RateLimit-Scope", "user")
          .json({
            message: "You are being rate limited.",
            retry_after: rateLimiter.limiter.blockDuration,
            global: false,
          });
      });
  };
}

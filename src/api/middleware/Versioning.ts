import { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
      // eslint-disable-next-line no-shadow
      interface Request {
          version?: string,
      }
  }
}

export function Versioning(req: Request, res: Response, next: NextFunction) {
  req.version = req.params.v ?? "6";

  return next();
}

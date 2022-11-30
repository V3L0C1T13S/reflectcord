import { NextFunction, Request, Response } from "express";
import { instanceOf } from "./check";
import { HTTPError } from "./HTTPError";

export function checkRoute(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = instanceOf(schema, req.body, { path: "body" });
      if (!result) return next(new HTTPError("Schema failed validation"));
      next();
    } catch {
      return next(new HTTPError("Schema failed validation"));
    }
  };
}

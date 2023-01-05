import { NextFunction, Request, Response } from "express";
import { instanceOf } from "./check";
import { HTTPError } from "./HTTPError";
import { enableBodyValidation } from "../constants";

export function validateBody(schema: any, body: any) {
  if (!enableBodyValidation) return;

  const result = instanceOf(schema, body, { path: "body" });
  if (!result) throw new HTTPError("Schema failed validation");
}

export function checkRoute(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!enableBodyValidation) next();

    try {
      const result = instanceOf(schema, req.body, { path: "body" });
      if (!result) return next(new HTTPError("Schema failed validation"));
      next();
    } catch {
      return next(new HTTPError("Schema failed validation"));
    }
  };
}

export const validate = checkRoute;

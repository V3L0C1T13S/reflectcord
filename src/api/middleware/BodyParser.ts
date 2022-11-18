import bodyParser, { OptionsJson } from "body-parser";
import { NextFunction, Request, Response } from "express";
import { HTTPError } from "@reflectcord/common/utils/HTTPError";

export function BodyParser(opts?: OptionsJson) {
  const jsonParser = bodyParser.json(opts);

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers["content-type"]) req.headers["content-type"] = "application/json";

    jsonParser(req, res, (err) => {
      if (err) {
        return next(new HTTPError("common:body.INVALID_BODY", 400));
      }
      next();
    });
  };
}

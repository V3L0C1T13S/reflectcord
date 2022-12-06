import { join } from "path";
import * as TJS from "typescript-json-schema";
import { NextFunction, Response, Request } from "express";
import Ajv from "ajv";
import { readdirSync } from "fs";
import { Logger } from "../Logger";
import { FieldErrors } from "../FieldError";

const schemasPath = join(__dirname, "../../schemas");

const settings: TJS.PartialArgs = {
  required: true,
};

// optionally pass ts compiler options
const compilerOptions: TJS.CompilerOptions = {
  target: 99,
};

const files = (() => {
  const f = readdirSync(join(schemasPath));
  return f.filter((x) => x !== "index.ts").map((file) => join(schemasPath, file));
})();

const program = TJS.getProgramFromFiles(
  files,
  compilerOptions,
  schemasPath,
);

const generator = TJS.buildGenerator(program, settings);

export type routeOptions = {
  body: string,
}

const ajv = new Ajv({
  allErrors: true,
  parseDate: true,
  allowDate: true,
  schemas: [],
  coerceTypes: true,
  messages: true,
  strict: true,
  strictRequired: true,
  allowUnionTypes: true,
});

export function validate(options: routeOptions) {
  const schema = generator?.getSchemaForSymbol(options.body);
  if (!schema) throw new Error(`Invalid schema - ${options.body} not found.`);

  if (!ajv.getSchema(options.body)) ajv.addSchema(schema as any, options.body);

  const schemaToValidate = ajv.getSchema(options.body);
  if (!schemaToValidate) throw new Error("Invalid schema!");

  return (req: Request, res: Response, next: NextFunction) => {
    const isValid = schemaToValidate(req.body);
    if (!isValid) {
      const fields: Record<string, { code?: string; message: string }> = {};

      Logger.log(`Invalid body for ${req.method} ${req.originalUrl}\n${req.body}`);
      schemaToValidate.errors?.forEach((x) => Logger.log(x.params));
      // eslint-disable-next-line no-return-assign
      schemaToValidate.errors?.forEach((x) => (fields[x.instancePath.slice(1)] = { code: x.keyword, message: x.message || "" }));

      throw FieldErrors(fields);
    }

    next();
  };
}

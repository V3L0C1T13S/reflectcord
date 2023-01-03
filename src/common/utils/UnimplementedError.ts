import { HTTPError } from "./HTTPError";

export class UnimplementedError extends HTTPError {
  constructor() {
    super("Unimplemented", 400);
  }
}

import { revoltJanuaryURL } from "../constants";

export function proxyFile(url: string) {
  return `${revoltJanuaryURL}/proxy?url=${encodeURIComponent(url)}`;
}

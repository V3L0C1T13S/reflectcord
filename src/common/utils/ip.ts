import { Request } from "express";

export function getIpAddress(req: Request): string {
  // @ts-ignore
  return (
    req.socket.remoteAddress
  );
}

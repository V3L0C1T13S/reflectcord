import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";

export function fastifyCSP(req: FastifyRequest, res: FastifyReply, done: HookHandlerDoneFunction) {
  res.header("Access-Control-Allow-Origin", "*");
  // TODO: use better CSP policy
  res.header(
    "Content-security-policy",
    "default-src *  data: blob: filesystem: about: ws: wss: 'unsafe-inline' 'unsafe-eval'; script-src * data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src * data: blob: 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src * data: blob: ; style-src * data: blob: 'unsafe-inline'; font-src * data: blob: 'unsafe-inline';",
  );
  res.header("Access-Control-Allow-Headers", req.headers["Access-Control-Request-Headers"] || "*");
  res.header("Access-Control-Allow-Methods", req.headers["Access-Control-Request-Methods"] || "*");

  done();
}

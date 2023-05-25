if (process.env["DIST"]) require("module-alias/register");
// eslint-disable-next-line import/first
import { ReflectcordEvil } from "./Server";

const server = new ReflectcordEvil();

server.start();

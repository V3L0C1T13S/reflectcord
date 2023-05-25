if (process.env["DIST"]) require("module-alias/register");
// eslint-disable-next-line import/first
import { ReflectcordGateway } from "./Server";

const gateway = new ReflectcordGateway();
gateway.init();

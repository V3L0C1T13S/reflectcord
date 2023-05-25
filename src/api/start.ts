if (process.env["DIST"]) require("module-alias/register");
// eslint-disable-next-line import/first
import { ReflectcordAPI } from "./Server";

const api = new ReflectcordAPI();
api.init();

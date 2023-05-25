if (process.env["DIST"]) require("module-alias/register");
// eslint-disable-next-line import/first
import { ReflectcordCDN } from "./Server";

const cdn = new ReflectcordCDN();
cdn.init();

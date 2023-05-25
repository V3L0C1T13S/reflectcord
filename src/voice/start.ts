if (process.env["DIST"]) require("module-alias/register");
// eslint-disable-next-line import/first
import { ReflectcordVoice } from "./Server";

const voiceServer = new ReflectcordVoice();
voiceServer.init();

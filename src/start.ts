import { ReflectcordCDN } from "./cdn";
import { ReflectcordAPI } from "./api";
import { ReflectcordGateway } from "./gateway";

const api = new ReflectcordAPI();
const gateway = new ReflectcordGateway();
const cdn = new ReflectcordCDN();
api.init();
gateway.start();
cdn.start();

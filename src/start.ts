import http from "http";
import { ReflectcordAPI } from "./api";
import { ReflectcordGateway } from "./gateway";

const api = new ReflectcordAPI();
const gateway = new ReflectcordGateway();
api.start();
gateway.start();

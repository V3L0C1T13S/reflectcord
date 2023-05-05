import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";
import { reflectcordWsURL } from "@reflectcord/common/constants";
import { APIGatewayResponse } from "@reflectcord/common/sparkle";

export default () => <Resource> {
  get: (req, res: Response<APIGatewayResponse>) => {
    res.json({
      url: reflectcordWsURL,
    });
  },
};

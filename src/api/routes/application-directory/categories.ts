import { Response } from "express";
import { Resource } from "express-automatic-routes";
import { GeneralCategory } from "@reflectcord/common/sparkle";

export default () => <Resource> {
  get: (req, res: Response<GeneralCategory[]>) => {
    res.json([{
      id: 4,
      name: "Entertainment",
    }]);
  },
};

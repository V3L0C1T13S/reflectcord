import { Resource } from "express-automatic-routes";
import { handleMemberEdit } from "../../../@me/nick";

export default () => <Resource> {
  put: async (req, res) => {
    // await handleMemberEdit(req, res, false);
  },
  delete: (req, res) => {},
};

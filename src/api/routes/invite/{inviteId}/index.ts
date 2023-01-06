import { Resource } from "express-automatic-routes";
import { getInvite, handleDeleteInvite } from "../../invites/{inviteId}";

// Legacy V8 and below API
export default () => <Resource> {
  get: (req, res) => getInvite(req, res),
  delete: (req, res) => handleDeleteInvite(req, res),
};

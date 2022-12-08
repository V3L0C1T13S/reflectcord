import { Resource } from "express-automatic-routes";

/**
 * Unknown what this is for. Client says it's an internal staff-only route.
 * SPECULATION: This refreshes the backends message cache when called by
 * a staff member.
*/
export default () => <Resource> {
  put: (req, res) => {
    res.sendStatus(401);
  },
  post: (req, res) => {
    res.sendStatus(401);
  },
};

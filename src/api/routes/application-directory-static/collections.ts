import { Resource } from "express-automatic-routes";
import { getCollections } from "../application-directory/collections";

export default () => <Resource> {
  get: getCollections,
};

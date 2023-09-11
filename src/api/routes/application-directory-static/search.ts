import { Resource } from "express-automatic-routes";
import { getApplicationDirectorySearch } from "../application-directory/search";

export default () => <Resource> {
  get: getApplicationDirectorySearch,
};

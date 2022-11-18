import { Resource } from "express-automatic-routes";
import { searchGifs } from "../../gifs/search";

export default () => <Resource> {
  get: async (req, res) => {
    await searchGifs(req, res, false);
  },
};

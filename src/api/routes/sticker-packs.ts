import { Resource } from "express-automatic-routes";

// STUB
export default () => <Resource> {
  get: (req, res) => {
    res.json({
      sticker_packs: [],
    });
  },
};

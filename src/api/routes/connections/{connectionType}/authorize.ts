import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: (req, res) => {
    res.json({
      url: "https://youtu.be/dQw4w9WgXcQ",
    });
  },
};

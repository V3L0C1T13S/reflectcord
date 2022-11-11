import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: (req, res) => {
    const id = req.params.app_id;

    /**
     * FIXME: This is only a proof of concept.
     * Ideally, we should download the app info from Discord itself
     * if the user enables a flag for it.
    */
    switch (id) {
      case "383226320970055681": {
        res.json({
          id,
          name: "Visual Studio Code",
          icon: "bc45e1c85351ce0bafcb9245b3762e75",
          description: "",
          summary: "",
          type: null,
          cover_image: "f1794a9f863d86c4a80aa51c3738fe58",
          hook: true,
          verify_key: "",
          flags: 0,
        });
        break;
      }
      case "367827983903490050": {
        res.json({
          id,
          name: "osu!",
          icon: "",
          description: "",
          summary: "",
          type: null,
          cover_image: "",
          hook: true,
          verify_key: "",
          flags: 0,
        });
        break;
      }
      default: {
        res.sendStatus(404);
        break;
      }
    }
  },

  post: (req, res) => {
    res.sendStatus(500);
  },
};

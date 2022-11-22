import { Resource } from "express-automatic-routes";
import { RPCUseStub } from "@reflectcord/common/constants";
import { GetDetectableApps, GetRPCApplication, HTTPError } from "@reflectcord/common/utils";

export default () => <Resource> {
  get: async (req, res) => {
    const id = req.params.app_id;
    if (!id) throw new HTTPError("Invalid ID");

    if (RPCUseStub) {
      // FIXME: OSS Rich presence backend when?
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
    } else {
      const application = await GetRPCApplication(id);

      if (!application) throw new HTTPError("Application not found", 404);

      res.json(application);
    }
  },

  post: (req, res) => {
    res.sendStatus(500);
  },
};

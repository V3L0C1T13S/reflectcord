import { reflectcordCDNURL } from "@reflectcord/common/constants";
import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  post: async (req, res) => {
    const { files } = req.body;

    res.json({
      attachments: files.map((x: any) => ({
        id: x.id,
        upload_filename: `__fixme/${x.filename}`,
        upload_url: `http://${reflectcordCDNURL}/attachments`,
      })),
    });
  },
};

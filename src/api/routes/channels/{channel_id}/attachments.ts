import { reflectcordCDNURL } from "@reflectcord/common/constants";
import { Resource } from "express-automatic-routes";
import { ulid } from "ulid";

export default () => <Resource> {
  post: async (req, res) => {
    const { files } = req.body;

    const uploadId = ulid();

    res.json({
      attachments: files.map((x: any) => ({
        id: Number(x.id),
        upload_filename: `${uploadId}/${x.filename}`,
        upload_url: `http://${reflectcordCDNURL}/attachments?upload_id=${uploadId}`,
      })),
    });
  },
};

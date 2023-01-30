import { reflectcordCDNURL } from "@reflectcord/common/constants";
import { Resource } from "express-automatic-routes";
import { ulid } from "ulid";
import { UploadedFile } from "@reflectcord/common/mongoose";

export default () => <Resource> {
  post: async (req, res) => {
    const { files } = req.body;

    res.json({
      attachments: await Promise.all(files.map(async (x: any) => {
        const uploadId = ulid();

        const file = await UploadedFile.create({
          _id: uploadId,
          info: {
            name: x.filename,
          },
        });
        await file.save();

        return {
          id: Number(x.id),
          upload_filename: `${uploadId}/${x.filename}`,
          upload_url: `http://${reflectcordCDNURL}/attachments?upload_id=${uploadId}`,
        };
      })),
    });
  },
};

import { describe, test, expect } from "@jest/globals";
import { postToAPI } from "@reflectcord/common/utils/testUtils";
import { TestChannelId } from "@reflectcord/common/constants";
import querystring from "node:querystring";

describe("new attachments (/channels/{id}/attachments)", () => {
  test("acquire bucket", async () => {
    const id = 0;
    const filename = "test.png";
    const fileInfo = await postToAPI(`channels/${TestChannelId}/attachments`, {
      files: [{
        id: id.toString(),
        filename,
      }],
    });

    expect(fileInfo.data.attachments).toBeInstanceOf(Array);
    expect(fileInfo.data.attachments.length).toBeGreaterThan(0);
    const attachment = fileInfo.data.attachments[0]!;

    const uploadId = new URL(attachment.upload_url).searchParams.get("upload_id");
    const filenameUploadId = attachment.upload_filename.split("/")[0];

    expect(attachment.id).toBe(id);
    expect(attachment.upload_filename.split("/").pop()).toBe(filename);
    expect(filenameUploadId).toBe(uploadId);
    expect(typeof attachment.upload_url === "string");
  });
});

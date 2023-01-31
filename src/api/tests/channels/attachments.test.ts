import { describe, test, expect } from "@jest/globals";
import { postToAPI } from "@reflectcord/common/utils/testUtils";
import { TestChannelId } from "@reflectcord/common/constants";
import { readFileSync } from "fs";
import { join } from "path";
import axios from "axios";
import { TestingToken } from "@reflectcord/common/rvapi";

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

    const testFile = readFileSync(join(__dirname, "../../../../docs/configuring.md"));

    const uploadResponse = await axios.put(attachment.upload_url, testFile, {
      headers: {
        Authorization: TestingToken,
      },
    });

    expect(uploadResponse.status).toBe(200);
  });
});

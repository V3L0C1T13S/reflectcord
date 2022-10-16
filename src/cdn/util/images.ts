import fetch from "node-fetch";
import { join } from "path";
import {
  existsSync, mkdirSync, readFileSync, writeFileSync,
} from "fs";
import { Request, Response } from "express";
import { AutumnURL } from "../../common/constants";

export type ImageType = "attachments" | "avatars" | "icons" | "backgrounds";

export const imageCacheDir = join(__dirname, "../../../cache/autumn");

if (!existsSync(imageCacheDir)) {
  mkdirSync(imageCacheDir, {
    recursive: true,
  });
}

export async function downloadImage(type: ImageType, id: string, autumn = AutumnURL) {
  const rvURL = `${autumn}/${type}/${id}`;
  const imgTypeCacheDir = join(imageCacheDir, type);

  if (!existsSync(imgTypeCacheDir)) mkdirSync(imgTypeCacheDir);

  const imgDir = join(imgTypeCacheDir, id);
  if (!existsSync(imgDir)) {
    console.log(`Downloading uncached ${type} ${id}`);
    const res = await (await fetch(rvURL)).buffer();
    writeFileSync(imgDir, res);
    return res;
  }

  const cachedImage = readFileSync(imgDir);

  return cachedImage;
}

export async function handleImgRequest(
  req: Request,
  res: Response,
  type: ImageType,
  id?: string,
  autumn?: string,
) {
  if (!id) return res.sendStatus(404);

  // Discord adds .png to the end, for some reason.
  const realId = id?.replace(/\.[^/.]+$/, "");
  if (!realId) return res.sendStatus(500);

  const avatarData = await downloadImage(type, realId);
  if (!avatarData) return res.sendStatus(404);

  res.set("Content-Type", "application/octet-stream");
  res.set("Cache-Control", "public, max-age=31536000");

  return res.send(avatarData);
}

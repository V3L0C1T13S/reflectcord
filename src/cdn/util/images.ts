import fetch from "node-fetch";
import { join } from "path";
import {
  existsSync, mkdirSync, readFileSync, writeFileSync,
} from "fs";
import { Request, Response } from "express";

export type ImageType = "attachments" | "avatars"

export const imageCacheDir = join(__dirname, "../../../cache/autumn");

export const defaultAutumnURL = "https://autumn.revolt.chat";

if (!existsSync(imageCacheDir)) {
  mkdirSync(imageCacheDir, {
    recursive: true,
  });
}

export async function downloadImage(type: ImageType, id: string, autumn = defaultAutumnURL) {
  const rvURL = `${autumn}/${type}/${id}`;
  const imgDir = join(imageCacheDir, id);
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

  return res.send(await avatarData);
}

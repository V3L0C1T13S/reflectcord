/*
  Fosscord: A FOSS re-implementation and extension of the Discord.com backend.
  Copyright (C) 2023 Fosscord and Fosscord Contributors

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published
  by the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/* eslint-disable no-param-reassign */
import express, { Application, Request, Response } from "express";
import ProxyAgent from "proxy-agent";
import fs from "fs";
import path from "path";
import fetch, { Headers, Response as FetchResponse } from "node-fetch";
import favicon from "serve-favicon";
import { Logger } from "@reflectcord/common/utils";
import { reflectcordWsURL, reflectcordCDNURL, discordBaseURL } from "@reflectcord/common/constants";

const AssetsPath = path.join(__dirname, "..", "..", "..", "assets");

const useTestClient = true;

class AssetCacheItem {
  // eslint-disable-next-line no-useless-constructor, @typescript-eslint/no-shadow
  constructor(public Key: string, public FilePath: string = "", public Headers: any = null as any) {}
}

type CachedFile = {
  path: string,
  headers: any,
}

function applyEnv(html: string): string {
  const CDN_ENDPOINT = reflectcordCDNURL;
  const GATEWAY_ENDPOINT = reflectcordWsURL;

  if (CDN_ENDPOINT) {
    html = html.replace(/CDN_HOST: .+/, `CDN_HOST: \`${CDN_ENDPOINT}\`,`);
  }
  if (GATEWAY_ENDPOINT) {
    html = html.replace(/GATEWAY_ENDPOINT: .+/, `GATEWAY_ENDPOINT: \`${GATEWAY_ENDPOINT}\`,`);
  }
  return html;
}

function applyInlinePlugins(html: string): string {
  // inline plugins
  const files = fs.readdirSync(path.join(AssetsPath, "inline-plugins"));
  let plugins = "";
  files.forEach((x) => {
    if (x.endsWith(".js")) plugins += `<script src='/assets/inline-plugins/${x}'></script>\n\n`;
  });
  return html.replaceAll("<!-- inline plugin marker -->", plugins);
}

function stripHeaders(headers: Headers): Headers {
  [
    "content-length",
    "content-security-policy",
    "strict-transport-security",
    "set-cookie",
    "transfer-encoding",
    "expect-ct",
    "access-control-allow-origin",
    "content-encoding",
  ].forEach((headerName) => {
    headers.delete(headerName);
  });
  return headers;
}

function replaceBrand(text: string) {
  const { INSTANCE_NAME } = process.env;
  let content = text;
  content = content.replaceAll(/ Discord /g, ` ${INSTANCE_NAME} `);
  content = content.replaceAll(/Discord /g, `${INSTANCE_NAME} `);
  content = content.replaceAll(/ Discord/g, ` ${INSTANCE_NAME}`);
  content = content.replaceAll(
    /Discord Nitro/g,
    `${INSTANCE_NAME} Nitro`,
  );
  content = content.replaceAll(/Discord Nitro/g, `${INSTANCE_NAME} Nitro`);
  content = content.replaceAll(/Discord's/g, `${INSTANCE_NAME}'s`);
  content = content.replaceAll(/\*Discord\*/g, `*${INSTANCE_NAME}*`);

  return content;
}

export function Client(app: Application) {
  const agent = new ProxyAgent();

  let html = fs.readFileSync(path.join(AssetsPath, "index.html"), { encoding: "utf8" });
  html = applyEnv(html);
  html = applyInlinePlugins(html);

  let newAssetCache: Map<string, AssetCacheItem> = new Map();
  let assetCacheDir = path.join(AssetsPath, "cache");
  if (process.env.ASSET_CACHE_DIR) assetCacheDir = process.env.ASSET_CACHE_DIR;

  if (!fs.existsSync(assetCacheDir)) fs.mkdirSync(assetCacheDir);

  if (fs.existsSync(path.join(assetCacheDir, "index.json"))) {
    const rawdata = fs.readFileSync(path.join(assetCacheDir, "index.json"));
    newAssetCache = new Map<string, AssetCacheItem>(Object.entries(JSON.parse(rawdata.toString())));
  }

  app.use(favicon(path.join(__dirname, "../../../images/icons/favicon.ico")));
  app.use("/assets", express.static(path.join(AssetsPath)));
  app.get("/assets/:file", async (req: Request, res: Response) => {
    try {
      delete req.headers.host;
      let response: FetchResponse;
      let buffer: Buffer;
      let assetCacheItem: AssetCacheItem = new AssetCacheItem(req.params.file!);
      if (newAssetCache.has(req.params.file!)) {
        assetCacheItem = newAssetCache.get(req.params.file!)!;
        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for (const key in assetCacheItem.Headers) {
          res.set(key, assetCacheItem.Headers[key]);
        }
      } else {
        if (req.params.file?.endsWith(".map")) {
          return res.status(404).send("Not found");
        }
        // eslint-disable-next-line no-console
        Logger.log(`[TestClient] Downloading file not yet cached! Asset file: ${req.params.file}`);
        response = await fetch(`${discordBaseURL}/assets/${req.params.file}`, {
          agent,
          // @ts-ignore
          headers: {
            ...req.headers,
          },
        });

        // set cache info
        assetCacheItem.Headers = Object.fromEntries(stripHeaders(response.headers));
        assetCacheItem.FilePath = path.join(assetCacheDir, req.params.file!);
        (assetCacheItem as any).Key = req.params.file;
        // add to cache and save
        newAssetCache.set(req.params.file!, assetCacheItem);
        fs.writeFileSync(path.join(assetCacheDir, "index.json"), JSON.stringify(Object.fromEntries(newAssetCache), null, 4));

        const { INSTANCE_NAME } = process.env;
        // Modify file to replace discord stuff
        if (req.params.file?.endsWith(".js") && INSTANCE_NAME) {
          const buff = await response.buffer();
          const content = replaceBrand(buff.toString());

          fs.writeFileSync(assetCacheItem.FilePath, content);
        } else fs.writeFileSync(assetCacheItem.FilePath, await response.buffer());
      }

      // eslint-disable-next-line no-restricted-syntax, guard-for-in
      for (const key in assetCacheItem.Headers) {
        res.set(key, assetCacheItem.Headers[key]);
      }

      return res.send(fs.readFileSync(assetCacheItem.FilePath));
    } catch (e) {
      return res.sendStatus(500);
    }
  });
  app.get("/developers*", (_req: Request, res: Response) => {
    res.set("Cache-Control", `public, max-age=${60 * 60 * 24}`);
    res.set("content-type", "text/html");

    if (!useTestClient) return res.send("Test client is disabled on this instance. Use a stand-alone client to connect this instance.");

    return res.send(fs.readFileSync(path.join(__dirname, "..", "..", "..", "assets", "developers.html"), { encoding: "utf8" }));
  });
  app.get("*", (req: Request, res: Response) => {
    res.set("Cache-Control", `public, max-age=${60 * 60 * 24}`);
    res.set("content-type", "text/html");

    if (req.url.startsWith("/api") || req.url.startsWith("/__development")) return;

    if (
      ["/download",
        "/nitro",
        "/blog",
        "/company",
        "/jobs",
        "/branding",
        "/build",
        "/streamkit",
        "/licenses",
        "/moderation",
        "/guidelines",
        "/privacy",
        "/safetycenter",
        "/newsroom",
        "/college",
        "/terms",
        "/acknowledgements",
      ]
        .some((x) => req.url.startsWith(x)) || req.url === "/") {
      res.set("Cache-Control", `public, max-age=${60 * 60 * 24}`);
      res.set("content-type", "text/html");

      if (!useTestClient) return res.send("Test client is disabled on this instance. Use a stand-alone client to connect this instance.");

      return res.send(fs.readFileSync(path.join(__dirname, "..", "..", "..", "assets", "landing_test.html"), { encoding: "utf8" }));
    }

    if (!useTestClient) return res.send("Test client is disabled on this instance. Use a stand-alone client to connect this instance.");
    if (req.url.startsWith("/invite")) return res.send(html.replace("9b2b7f0632acd0c5e781", "9f24f709a3de09b67c49"));

    return res.send(html);
  });
}

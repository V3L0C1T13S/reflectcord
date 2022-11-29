/* eslint-disable no-param-reassign */
import express, { Application, Request, Response } from "express";
import ProxyAgent from "proxy-agent";
import fs from "fs";
import path from "path";
import fetch, { Headers, Response as FetchResponse } from "node-fetch";
import axios from "axios";
import favicon from "serve-favicon";
import { Logger } from "@reflectcord/common/utils";
import { reflectcordWsURL, reflectcordCDNURL } from "@reflectcord/common/constants/index";

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

export function ClientV2(app: Application) {
  const agent = new ProxyAgent();

  const html = applyEnv(fs.readFileSync(path.join(AssetsPath, "index.html"), { encoding: "utf8" }));

  const cacheDir = path.join(AssetsPath, "cache");

  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  app.use("/assets", express.static(path.join(AssetsPath)));
  app.get("/assets/:file", async (req: Request, res: Response) => {
    if (!req.params.file) return;

    delete req.headers.host;

    const fullFilePath = path.join(AssetsPath, req.params.file);
    const cachedFilePath = path.join(cacheDir, req.params.file);

    if (req.params.file.endsWith(".map")) return res.sendStatus(404);

    if (!fs.existsSync(fullFilePath) && !fs.existsSync(cachedFilePath)) {
      const file = await axios.get(`https://discord.com/assets/${req.params.file}`, {
        httpAgent: agent,
        headers: {
          ...req.headers,
        },
      });

      fs.writeFileSync(cachedFilePath, file.data);

      return res.send(file.data);
    }

    const file = fs.readFileSync(cachedFilePath);

    return res.send(file);
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

    if (!useTestClient) return res.send("Test client is disabled on this instance. Use a stand-alone client to connect this instance.");
    if (req.url.startsWith("/invite")) return res.send(html.replace("9b2b7f0632acd0c5e781", "9f24f709a3de09b67c49"));

    return res.send(html);
  });
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
        response = await fetch(`https://discord.com/assets/${req.params.file}`, {
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
        // download file
        fs.writeFileSync(assetCacheItem.FilePath, await response.buffer());
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

    if (!useTestClient) return res.send("Test client is disabled on this instance. Use a stand-alone client to connect this instance.");
    if (req.url.startsWith("/invite")) return res.send(html.replace("9b2b7f0632acd0c5e781", "9f24f709a3de09b67c49"));

    return res.send(html);
  });
}

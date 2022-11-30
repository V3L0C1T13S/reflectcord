import { Request } from "express";
import { Resource } from "express-automatic-routes";
import { instanceOf, HTTPError, checkRoute } from "@reflectcord/common/utils";
import { DbManager } from "@reflectcord/common/db";
import { enableMetrics } from "@reflectcord/common/constants";

export type MetricsTags = "platform:web" | "platform:desktop";

interface MetricsBody {
  name: string,
  tags: MetricsTags[],
}

// eslint-disable-next-line no-redeclare
const MetricsBody = {
  name: String,
  tags: [],
};

interface MetricsPostBody {
  metrics: MetricsBody[],
}

// eslint-disable-next-line no-redeclare
const MetricsPostBody = {
  metrics: [],
};

const metrics = DbManager.client.db("reflectcord")
  .collection<MetricsBody>("metrics");

const MetricsPostSchema = {
  metrics: [MetricsBody],
};

export default () => <Resource> {
  post: {
    middleware: checkRoute(MetricsPostSchema),
    handler: async (req: Request<{}, {}, MetricsPostBody>, res) => {
      if (!enableMetrics) return res.sendStatus(204);

      const { body } = req;

      try {
        await Promise.all(body.metrics.map((x) => metrics.insertOne(x)));
      } catch (e) {
        throw new HTTPError((e as any).toString(), 400);
      }

      return res.sendStatus(204);
    },
  },
};

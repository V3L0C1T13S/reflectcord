import { Request } from "express";
import { Resource } from "express-automatic-routes";
import { check, instanceOf } from "../../common/utils/check";
import { DbManager } from "../../common/db";
import { HTTPError } from "../../common/utils";
import { enableMetrics } from "../../common/constants";

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

export default () => <Resource> {
  post: async (req: Request<{}, {}, MetricsPostBody>, res) => {
    if (!enableMetrics) return res.sendStatus(204);

    const { body } = req;

    try {
      await Promise.all(body.metrics.map(async (x) => {
        const result = instanceOf(MetricsBody, x, { path: "body" });
        if (result) await metrics.insertOne(x);
        else throw result;
      }));
    } catch (e) {
      throw new HTTPError((e as any).toString(), 400);
    }

    return res.sendStatus(204);
  },
};

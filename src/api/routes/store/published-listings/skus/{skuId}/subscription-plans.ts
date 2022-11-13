import { Application } from "express";
import { Resource } from "express-automatic-routes";

const productStub = {
  id: "0",
  name: "stub",
  interval: 1,
  interval_count: 1,
  tax_inclusive: true,
  sku_id: "590665532894740483",
  currency: "usd",
  price: 999,
  price_tier: null,
  prices: [{
    country_prices: {
      country_code: "US",
      prices: [{
        currency: "usd",
        amount: 999,
        exponent: 2,
      }],
    },
  }],
  payment_source_prices: [],
};

export default (express: Application) => <Resource> {
  get: (req, res) => {
    res.json([{
      ...productStub,
      id: "511651880837840896",
      name: "Nitro monthly",
      sku_id: "511651880837840896",
    }]);
  },
};

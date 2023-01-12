import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: (req, res) => {
    // STUB: SKUs
    res.json([
      {
        id: "",
        name: "",
        interval: 1,
        interval_count: 1,
        tax_inclusive: true,
        sku_id: "",
        fallback_price: 499,
        fallback_currency: "eur",
        currency: "eur",
        price: 4199,
        price_tier: null,
      },
    ]);
  },
};

import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: (req, res) => {
    res.json({
      revolt: "0.5.5",
      features: {
        captcha: { enabled: true, key: "3daae85e-09ab-4ff6-9f24-e8f4f335e433" },
        email: true,
        invite_only: false,
        autumn: { enabled: true, url: "https://autumn.revolt.chat" },
        january: { enabled: true, url: "https://jan.revolt.chat" },
        voso: { enabled: false, url: "", ws: "" },
      },
      app: "",
      vapid: "",
      extensions: ["RFC_SNOWFLAKE_CONVERSION", "RFC_VIDEO", "RDVSP\n3015\nICE"],
    });
  },
};

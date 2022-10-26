import axios from "axios";
import parse from "node-html-parser";
import { revoltDiscoveryURL } from "../../constants";

let rvDiscoveryBuild: string | null = null;

export async function getNextData() {
  if (rvDiscoveryBuild) return rvDiscoveryBuild;

  const rvDiscoveryPage = await axios.get(`${revoltDiscoveryURL}/discover/servers`);

  const data = parse(String(rvDiscoveryPage.data));

  const nextData = data.getElementById("__NEXT_DATA__");

  const jsonData = JSON.parse(nextData.textContent);

  const { buildId } = jsonData;

  rvDiscoveryBuild = buildId;

  return buildId as string;
}

import axios from "axios";
import axiosRateLimit from "axios-rate-limit";
import { TestingToken } from "../../rvapi";
import { baseURL } from "../../constants";

export const apiURL = `${baseURL}/api`;

export const rateLimitSettings = {
  maxRequests: 3,
  perMilliseconds: 1000,
  maxRPS: 3,
};

export const TestAxiosClient = axiosRateLimit(axios.create(), rateLimitSettings);

export async function getFromAPI(url: string) {
  const res = await TestAxiosClient.get(`${apiURL}/${url}`, {
    headers: {
      authorization: TestingToken,
    },
  });

  console.log(res.data);

  return res;
}

export async function postToAPI(url: string, data: any) {
  const res = await TestAxiosClient({
    method: "post",
    url: `${apiURL}/${url}`,
    headers: {
      authorization: TestingToken,
    },
    data,
  });

  console.log(res.data);

  return res;
}

export async function deleteFromAPI(url: string) {
  const res = await TestAxiosClient({
    method: "delete",
    url: `${apiURL}/${url}`,
    headers: {
      authorization: TestingToken,
    },
  });

  console.log(res.data);

  return res;
}

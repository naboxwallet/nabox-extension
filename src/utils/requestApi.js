import { request } from "./request";

async function requestApi(requestData) {
  const respondData = {
    success: false,
    data: "request fail"
  }
  try {
    const res = await request(requestData);
    if (res.code === 1000) {
      respondData.success = true;
      respondData.data = res.data;
    }
  } catch (e) {
    respondData.data = e;
  }
  return respondData;

}

export async function getAssetsList(data) {
  const requestData = {
    url: "/wallet/address/assets",
    data
  };
  return await requestApi(requestData);
}
export async function getAssetList(data) {

}
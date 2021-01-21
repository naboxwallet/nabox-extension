import axios from "axios";
import {config} from "@/config.js";
import ExtensionPlatform from "@/utils/extension";

axios.defaults.headers.post["Content-Type"] = "application/json";

export async function request(params) {
  const {url, method = "post", data, network} = params;
  let newNetwork;
  if (network) {
    newNetwork = network;
  } else {
    newNetwork = (await ExtensionPlatform.get("network")).network || "main";
  }
  const baseUrl = config[newNetwork].BASE_URL;
  const language = localStorage.getItem("lang") === "cn" ? "CHS" : "EN";
  const newData =
    method === "post" ? {data: {language, ...data}} : {params: {language, ...data}};
  return new Promise((resolve, reject) => {
    //console.log(newData);
    axios({url: baseUrl + url, method: method, ...newData}).then(
      response => {
        resolve(response.data);
      },
      err => {
        reject(err);
      }
    );
  });
}

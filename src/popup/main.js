// 点击插件按钮弹出页面
import Vue from "vue";
import App from "./App.vue";
import router from "../router";
import store from "../store";
import i18n from "../plugins/element";
import {getStorage} from "./../utils/util";
import {request} from "./../utils/request";


const development = process.env.NODE_ENV === "development"

if (!development) {
  console.log = () => {};
}

router.beforeEach(async (to, from, next) => {
  //console.log(to, from, next);
  const accountList = await getStorage("accountList", []);
  const password = await getStorage("password", "");
  if (!password && to.path !== "/login") {
    next("/login");
  } else if (password && !accountList.length && to.path !== "/new-address") {
    next("/new-address");
  } else {
    if (from.path === "/") {
      Vue.prototype.$goHome = true;
    } else if (from.path === "/new-address") {
      Vue.prototype.$goHome = true;
    } else {
      Vue.prototype.$goHome = false;
    }
    next();
  }
});
Vue.prototype.$request = request;

//获取主网和测试网络的配置文件
async function getConfigByNetwork() {
  try {
    const beta = await getConfig("beta");
    const main = await getConfig("main");
    const config = {beta, main};
    localStorage.setItem("config", JSON.stringify(config));
  } catch (e) {
    //
  }
}

//获取网络配置文件
async function getConfig(network) {
  const info = await request({url: "/api/chain/config", method: "get", network});
  //console.log(betaRes, "==config==");
  const res = {};
  if (info.data && info.data.length) {
    info.data.map(v => {
      const mainInfo = v.mainAsset;
      res[v.chain] = {
        chainId: mainInfo ? mainInfo.chainId : "",
        assetId: mainInfo ? mainInfo.assetId : "",
        prefix: v.prefix,
        symbol: mainInfo ? mainInfo.symbol : "",
        decimal: mainInfo ? mainInfo.decimals : "",
        assets: v.assets,
        config: v.configs,
        nativeId: v.nativeId
      }
    });
  } else {
    throw "get config error"
  }
  return res
}

getConfigByNetwork();

/* eslint-disable no-new */
new Vue({
  el: "#app",
  router,
  store,
  i18n,
  render: h => h(App)
});

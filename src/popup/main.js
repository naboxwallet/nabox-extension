// 点击插件按钮弹出页面
import Vue from "vue";
import App from "./App.vue";
import router from "../router";
import store from "../store";
import i18n from "../plugins/element";
// import "../plugins/element";
import ExtensionPlatform from "@/utils/extension";
import { request } from "@/utils/request";

router.beforeEach(async (to, from, next) => {
  const password = (await ExtensionPlatform.get("password")).password;
  const accountList =
    (await ExtensionPlatform.get("accountList")).accountList || [];
  if (!password && to.path !== "/login") {
    next("/login");
  } else if (password && !accountList.length && to.path !== "/new-address") {
    next("/new-address");
  } else {
    if (from.path === "/") {
      Vue.prototype.$goHome = true;
    } else {
      Vue.prototype.$goHome = false;
    }
    next();
  }
});
Vue.prototype.$request = request;

async function getConfig() {
  try {
    const betaRes = await request({
      url: "/api/chain/config",
      method: "get",
      network: "beta"
    });
    /* const mainRes = await request({
      url: "/api/chain/config",
      network: "main"
    }); */
    console.log(betaRes, "==config==");
    let beta = {};
    if (betaRes.data && betaRes.data.length) {
      betaRes.data.map(v => {
        const mainInfo = v.mainAsset;
        beta[v.chain] = {
          chainId: mainInfo ? mainInfo.chainId : "",
          assetId: mainInfo ? mainInfo.assetId : "",
          prefix: v.prefix,
          symbol: mainInfo ? mainInfo.symbol : "",
          decimal: mainInfo ? mainInfo.decimals : "",
          assets: v.assets
        }
      });
    }
    const config = { beta, main: beta };
    sessionStorage.setItem("config", JSON.stringify(config));
  } catch (e) {
    console.error(e, "获取链配置失败");
  }
  /* eslint-disable no-new */
  new Vue({
    el: "#app",
    router,
    store,
    i18n,
    render: h => h(App)
  });
}
getConfig();

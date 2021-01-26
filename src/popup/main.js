// 点击插件按钮弹出页面
import Vue from "vue";
import App from "./App.vue";
import router from "../router";
import store from "../store";
import i18n from "../plugins/element";
import {getStorage} from "./../utils/util";
import {request} from "./../utils/request";

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

async function getConfig() {
  try {
    const betaRes = await request({url: "/api/chain/config", method: "get", network: "beta"});
    //console.log(betaRes, "==config==");
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
          assets: v.assets,
          config: v.configs
        }
      });
    }
    const config = {beta, main: beta};
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

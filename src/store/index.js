import Vue from "vue";
import Vuex from "vuex";
import ExtensionPlatform from "@/utils/extension";
import { request } from "@/utils/request";
import { getStorage } from "@/utils/util";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    accountList: [],
    network: "main"
  },
  getters: {
    currentAccount(state) {
      // console.log(new Date().getTime(), "999")
      return state.accountList.filter(v => v.selection)[0];
    }
  },
  mutations: {
    setAccount(state, data) {
      state.accountList = data;
    },
    setNetwork(state, data) {
      state.network = data;
    }
  },
  actions: {
    async setAccount({ state, commit }, account) {
      let currentAccount = null;
      for (let v = 0; v < account.length; v++) {
        if (account[v].selection) {
          currentAccount = account[v];
          try {
            const balance = await getAccountUSD(account[v].pub);
            if (balance) {
              if (state.network === "main") {
                account[v].balance_main = balance;
              } else {
                account[v].balance_beta = balance;
              }
            }
          } catch (e) {
            //
          }
        }
      }
      await ExtensionPlatform.set({
        accountList: account
      });
      // console.log(new Date().getTime(), "999" - 1);
      commit("setAccount", account);

      const naboxBridge = await getStorage("naboxBridge", {});
      naboxBridge.currentAccount = currentAccount;
      ExtensionPlatform.set({ naboxBridge });
    },
    async setNetwork({ commit }, network) {
      // console.log(5566)
      await ExtensionPlatform.set({ network });
      commit("setNetwork", network);
      const naboxBridge = await getStorage("naboxBridge", {});
      naboxBridge.network = network;
      ExtensionPlatform.set({ naboxBridge });
    }
  },
  modules: {}
});

async function getAccountUSD(pub) {
  const res = await request({
    url: "/wallet/price",
    data: {
      pubKey: pub
    }
  });
  if (res.code === 1000) {
    return res.data;
  }
  return null;
}

import Vue from "vue";
import Vuex from "vuex";
import ExtensionPlatform from "@/utils/extension";
import { request } from "@/utils/request";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    accountList: [],
    network: "main"
  },
  getters: {
    currentAccount(state) {
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
      for (let v = 0; v < account.length; v++) {
        if (account[v].selection) {
          const balance = await getAccountUSD(account[v].pub);
          if (balance) {
            if (state.network === "main") {
              account[v].balance_main = balance;
            } else {
              account[v].balance_beta = balance;
            }
          }
        }
      }
      console.log(account, 8888)
      await ExtensionPlatform.set({
        accountList: account
      });
      commit("setAccount", account);
    },
    async setNetwork({ commit }, network) {
      await ExtensionPlatform.set({ network });
      commit("setNetwork", network);
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

<template>
  <div class="app-content w350">
    <transition name="fade-transform" mode="out-in">
      <router-view/>
    </transition>
  </div>
</template>

<script>
  import ExtensionPlatform from "@/utils/extension";
  import {getStorage} from "@/utils/util";
  // import "@/utils/api"

  export default {
    name: "App",
    data() {
      return {};
    },
    watch: {
      '$store.getters.currentAccount': {
        immediate: true,
        handler(account) {
          // 定时调取后台接口更新账户信息, 避免在其他网络加入流动性等操作无法同步账户余额
          this.refreshAccountInterval(account);
        }
      }
    },
    created() {
      const loading = document.getElementById("file-loading");
      if (loading) {
        loading.style.display = "none";
      }
    },
    async mounted() {
      const localStore = await ExtensionPlatform.get();
      console.log(localStore, "===localStore===")
      const accountList = localStore.accountList || [] //await getStorage("accountList", []);
      const nabox = localStore.nabox || {}; // await getStorage("nabox", {});
      console.log(nabox, "----nabox----");
      /* nabox.allowSites = [];
      ExtensionPlatform.set({nabox}) */
      const network = await getStorage("network", nabox.network ? nabox.network : "main");
      //console.log(accountList, network, "app-mounted");
      if (!nabox.network && !nabox.chain && !nabox.allowSites && !nabox.chainId) {
        // 首次安装设置默认值
        nabox.network = "main";
        nabox.chain = "Ethereum";
        nabox.chainId = "0x1";
        nabox.allowSites = [];
      }
      ExtensionPlatform.set({ nabox })
      this.$store.commit("setAccount", accountList);
      this.$store.commit("setNetwork", network);
    },
    methods: {
      refreshAccountInterval(account) {
        this.refreshAccount(account)
        const timer = setInterval(() => {
          this.refreshAccount(account)
        }, 1000*5*60)
        this.$once("hook:beforeDestroy", () => {
          clearInterval(timer)
        })
      },
      refreshAccount(account) {
        if (!account || !account.pub) return;
        this.$request({
          url: "/wallet/refresh",
          data: {"pubKey": account.pub}
        });
      },
    }
  };
</script>

<style lang="less">
  @import "../assets/css/base";

  .app-content {
    background-color: #fff;
    position: relative;
    width: 350px;
    height: 600px;
    overflow-y: auto;
    overflow-x: hidden;
  }
</style>

<template>
  <div class="app-content w350">
    <transition name="fade-transform" mode="out-in">
      <router-view />
    </transition>
  </div>
</template>

<script>
import ExtensionPlatform from "@/utils/extension";
import { getStorage } from "@/utils/util";
export default {
  name: "App",
  data() {
    return {};
  },
  created() {
    const loading = document.getElementById("file-loading");
    if (loading) {
      loading.style.display = "none";
    }
  },
  async mounted() {
    // await ExtensionPlatform.clear(); //清除本地数据
    // await ExtensionPlatform.remove("nabox");
    var a = await ExtensionPlatform.get();
    console.log(a, "===---=storage=---===");
    const accountList = await getStorage("accountList", []);
    const network = await getStorage("network", "main");
    console.log(accountList, network, "app-mounted");
    this.$store.commit("setAccount", accountList);
    this.$store.commit("setNetwork", network);
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

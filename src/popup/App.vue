<template>
  <div class="app-content w350">
    <transition name="fade-transform" mode="out-in">
      <router-view />
    </transition>
  </div>
</template>

<script>
import ExtensionPlatform from "@/utils/extension";
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
    await ExtensionPlatform.remove("naboxBridge");
    const accountList =
      (await ExtensionPlatform.get("accountList")).accountList || [];
    console.log(accountList, 888);
    const network = (await ExtensionPlatform.get("network")).network || "main";
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

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
  async mounted() {
    // await ExtensionPlatform.clear(); //清除本地数据
    const accountList =
      (await ExtensionPlatform.get("accountList")).accountList || [];
    console.log(accountList, 888);
    const network = (await ExtensionPlatform.get("network")).network || "main";
    console.log(network, "===network");
    this.$store.commit("setAccount", accountList);
    this.$store.commit("setNetwork", network);
    /* const a = await this.$request({
      url: "/",
      method: "get",
      data: {a:1},
      network: "beta"
    }) */
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

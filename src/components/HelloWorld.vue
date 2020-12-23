<template>
  <div>
    <p>{{ defaultText }}</p>
    <p>{{ $t('home.extName') }}</p>
    <p>{{ version }}</p>
    <button @click="selectLang">切换语言</button>
    <button @click="viewOnBrowser">在浏览器上查看</button>
    <button @click="showMsg('confirmed')">显示成功通知</button>
    <button @click="showMsg('failed')">显示失败通知</button>
    <el-button>打包体积测试</el-button>
    <br />
    <el-button type="primary" @click="set">存入缓存</el-button>
    <br />
    <el-button type="primary" @click="get">get缓存</el-button>
    <br />
    <el-button type="primary" @click="remove">删除密码</el-button>
  </div>
</template>

<script>
import ExtensionPlatform from "@/utils/extension";
export default {
  name: "HelloWorld",
  data() {
    return {
      version: ExtensionPlatform.getVersion()
    };
  },
  mounted() {
    browser.runtime.sendMessage({});
  },
  computed: {
    defaultText() {
      return browser.i18n.getMessage("extName");
    }
  },
  methods: {
    selectLang() {
      this.$i18n.locale = this.$i18n.locale === "cn" ? "en" : "cn";
    },
    viewOnBrowser() {
      ExtensionPlatform.openExtensionInBrowser()
    },
    showMsg(type) {
      const txMeta = { status: type };
      ExtensionPlatform.showTransactionNotification(txMeta)
    },
    set() {
      const obj = { name: 1 }
      ExtensionPlatform.set({
        a: obj
      });
      ExtensionPlatform.set({
        b: JSON.stringify(obj)
      });
    },
    async get() {
      const all = await ExtensionPlatform.get();
      const b = await ExtensionPlatform.get("b");
      const password = await ExtensionPlatform.get("password")
      console.log(all, 888);
      console.log(b, 777);
      console.log(password, "password");
    },
    remove() {
      ExtensionPlatform.remove("password");
    }
  }
};
</script>

<style scoped>
p {
  font-size: 20px;
}
</style>

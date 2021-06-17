<template>
  <div class="lock-page">
    <img src="../../assets/img/logo.svg" alt=""/>
    <el-input v-model="password" type="password" @keyup.enter.native="checkPassword">
    </el-input>
    <el-button type="primary" @click="checkPassword">
      {{ $t("public.unlock") }}
    </el-button>
  </div>
</template>

<script>
  import {checkPassword, getStorage} from "@/utils/util";
  import ExtensionPlatform from "@/utils/extension";

  export default {
    data() {
      return {
        password: ""
      };
    },

    methods: {
      //验证密码
      async checkPassword() {
        const correct = await checkPassword(this.password);
        if (correct) {
          const nabox = await getStorage("nabox", {});
          nabox.lock = false;
          ExtensionPlatform.set({nabox});
          this.$router.push("/");
        } else {
          this.$message({message: this.$t("login.login11"), type: "warning", duration: 1500});
        }
      }
    }
  };
</script>
<style lang="less">
  .lock-page {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 100px 25px 0;
    img {
      width: 130px;
    }
    .el-input {
      margin: 25px 0;
    }
    .el-button {
      width: 100%;
    }
  }
</style>

<template>
  <div class="lock-page">
    <img src="../../assets/img/logo.svg" alt="" />
    <el-input v-model="password" type="password"></el-input>
    <el-button type="primary" @click="checkPassword">
      {{ $t("public.unlock") }}
    </el-button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      password: ""
    };
  },

  methods: {
    checkPassword() {
      console.log(this.password, "====password====");
      this.$router.push("/");
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

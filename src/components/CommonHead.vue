<template>
  <div class="common-head">
    <i class="el-icon-arrow-left" @click="handleBack"></i>
    <slot>
    </slot>
    <slot name="right">
    </slot>
  </div>
</template>

<script>
  export default {
    data() {
      return {};
    },
    props: {
      backControl: Boolean
    },
    methods: {
      handleBack() {
        console.log("**back**");
        console.log(this.backControl);
        console.log(this.$goHome);
        if (this.backControl) {
          this.$emit("back");
        } else if (this.$goHome) {
          this.$router.push("/");
        } else {
          this.$router.back();
        }
      }
    }
  };
</script>
<style lang="less">
  .common-head {
    height: 70px;
    line-height: 70px;
    font-size: 14px;
    box-shadow: 0 3px 4px rgba(135, 134, 134, 0.16);
    position: relative;
    text-align: center;
    color: #3a3c44;
    background-color: #fff;
    i {
      font-size: 18px;
      cursor: pointer;
      color: #a5abb2;
    }
    .el-icon-arrow-left {
      position: absolute;
      left: 22px;
      top: 25px;
      font-weight: 600;
    }
  }
</style>

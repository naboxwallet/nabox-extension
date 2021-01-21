<template>
  <transition name="fade-transform" mode="out-in">
    <div class="transfer-confirm" v-if="show">
      <common-head backControl @back="handleBack">
        {{ $t("transferConfirm.transferConfirm1") }}
      </common-head>
      <div class="content shadow">
        <div class="transfer-item">
          <label>{{ $t("transferConfirm.transferConfirm2") }}</label>
          <P>{{ data.from }}</P>
        </div>
        <div class="transfer-item">
          <label>{{ $t("transferConfirm.transferConfirm3") }}</label>
          <P>{{ data.to }}</P>
        </div>
        <div class="transfer-item">
          <label>{{ $t("public.amount") }}</label>
          <P>{{ data.amount + data.assetSymbol }}</P>
        </div>
        <div class="transfer-item">
          <label>{{ $t("public.fee") }}</label>
          <P>{{ data.fee }}</P>
        </div>
        <div class="transfer-item">
          <label>{{ $t("public.remark") }}</label>
          <P>{{ data.remarks }}</P>
        </div>
      </div>
      <el-button type="primary" @click="$emit('confirm')">
        {{ $t("public.confirm") }}
      </el-button>
    </div>
  </transition>
</template>

<script>
  import CommonHead from "@/components/CommonHead";

  export default {
    data() {
      return {
        show: false
      };
    },
    props: {
      visiable: Boolean,
      data: {
        type: Object,
        default: () => {
        }
      }
    },
    watch: {
      visiable(val) {
        setTimeout(() => {
          this.show = val;
        }, 300);
      }
    },

    components: {
      CommonHead
    },

    methods: {
      handleBack() {
        this.show = false;
        setTimeout(() => {
          this.$emit("update:visiable", false);
        }, 300);
      }
    }
  };
</script>
<style lang='less' scoped>
  .transfer-confirm {
    background-color: #f9fafc;
    height: 100%;
    .content {
      margin: 20px;
      background: #fff;
      border-radius: 20px;
      padding: 20px;
    }
    .transfer-item {
      margin-bottom: 20px;
      label {
        color: #a5abb2;
        font-size: 12px;
      }
      p {
        margin-top: 5px;
        font-size: 14px;
        color: #3a3c44;
      }
    }
    .el-button {
      width: calc(100% - 40px);
      margin: 20px 20px 0;
    }
  }
</style>

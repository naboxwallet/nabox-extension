<template>
  <transition name="fade-transform" mode="out-in">
    <div class="transfer-confirm" v-if="show">
      <common-head backControl color="#53B8A9" @back="handleBack">
        {{ $t("transferConfirm.transferConfirm1") }}
      </common-head>
      <div class="transfer-info shadow">
        <div class="content">
          <div class="transfer-item">
            <label>{{ $t("transferConfirm.transferConfirm2") }}</label>
            <P>{{ data.from }}</P>
          </div>
          <div class="transfer-item" v-show="data.to">
            <label>{{ $t("transferConfirm.transferConfirm3") }}</label>
            <P>{{ data.to }}</P>
          </div>
          <div class="transfer-item" v-show="data.network">
            <label>{{ $t("public.recipientNetwork") }}</label>
            <P>{{ data.network }}</P>
          </div>
          <div class="transfer-item">
            <label>{{ $t("public.amount") }}</label>
            <P>{{ data.amount + data.assetSymbol }}</P>
          </div>
          <div class="transfer-item">
            <label>{{ $t("public.fee") }}</label>
            <P>{{ data.fee }}</P>
          </div>
          <!--<div class="transfer-item" v-show="data.type ===1 || data.type ===2">-->
          <div class="transfer-item" v-show="data.type ===2">
            <label>{{ $t("public.remark") }}</label>
            <P style="word-wrap: break-word;width: 250px;max-height: 60px;overflow-x: auto">
              {{data.remarks }}</P>
          </div>
        </div>
        <el-button type="primary" @click="$emit('confirm')">
          {{ $t("public.confirm") }}
        </el-button>
      </div>
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
        //console.log("--transferConfirm--",this.data);
        setTimeout(() => {
          this.show = val;
        }, 300);
      }
    },

    components: {
      CommonHead
    },
    created() {

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
    background-color: #53B8A9;
    height: 600px;
    .transfer-info {
      width: 300px;
      height: 470px;
      margin: 0 auto;
      background-color: #fff;
      border-radius: 5px;
      .content {
        padding: 20px;
        min-height: 396px;
      }
      .transfer-item {
        margin-bottom: 15px;
        display: block;
        label {
          color: #a5abb2;
          font-size: 12px;
          display: block;
          width: 50%;
        }
        p {
          margin-top: 5px;
          font-size: 14px;
          color: #3a3c44;
        }
      }
      .el-button {
        width: calc(100% - 40px);
        margin: -10px 20px 0;
      }
    }

  }
</style>

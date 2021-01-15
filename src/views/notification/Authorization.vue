<template>
  <div class="authorization">
    <div class="from-wrap">
      <div class="from-logo">
        <img
          v-if="notification.data && notification.data.icon"
          :src="notification.data.icon"
        />
        <i v-else>C</i>
      </div>
      <p class="from-origin">
        {{ notification.domain }}
      </p>
    </div>
    <div class="select-account">
      <h3 class="tc">{{ $t("authorization.authorization1") }}</h3>
    </div>
    <div class="network-list">
      <h3>{{ $t("authorization.authorization5") }}</h3>
      <el-radio-group v-model="network">
        <el-radio :key="item" :label="item" v-for="item in networkList">
          {{ item }}
        </el-radio>
      </el-radio-group>
    </div>
    <div class="btn-wrap">
      <el-button @click="reject">{{ $t("public.cancel") }}</el-button>
      <el-button type="primary" @click="connect">
        {{ $t("authorization.authorization4") }}
      </el-button>
    </div>
  </div>
</template>

<script>
import NotificationService from "@/utils/NotificationService";
export default {
  data() {
    return {
      notification: {},
      networkList: ["NULS", "NERVE", "Ethereum", "BSC", "Heco"],
      network: "NULS",
    };
  },

  components: {},

  watch: {},

  computed: {},

  created() {},

  async mounted() {
    this.notification = chrome.extension.getBackgroundPage().notification;
  },

  methods: {
    close() {
      NotificationService.close();
    },
    reject() {
      this.notification.responder(false);
      this.close();
    },
    async connect() {
      this.notification.responder(this.network);
      this.close();
    }
  }
};
</script>
<style lang="less">
.authorization {
  padding-top: 100px;
  .from-wrap {
    display: flex;
    align-items: center;
    flex-direction: column;
    .from-origin {
      font-size: 14px;
      color: #6a737d;
      margin: 20px 0 30px;
      padding: 0 80px;
      text-align: center;
    }
  }
  .from-logo {
    border-radius: 50%;
    border: 1px solid #f2f3f4;
    background: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 64px;
    height: 64px;
    img {
      width: 48px;
      height: 48px;
    }
    i {
      color: #000;
      font-style: normal;
    }
  }
  .select-account h3 {
    margin-bottom: 10px;
    font-size: 14px;
  }
  .network-list {
    margin-left: 30px;
    h3 {
      margin-bottom: 5px;
      font-size: 14px;
    }
    .el-radio {
      display: block;
    }
  }
  .btn-wrap {
    text-align: center;
    margin-top: 70px;
    .el-button {
      height: 35px;
      border-radius: 5px;
      font-size: 12px;
      padding: 12px 0px;
      width: 120px;
      &+.el-button {
        margin-left: 20px;
      }
    }
  }
}
</style>

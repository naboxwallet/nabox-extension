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
      accountList: []
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
      this.notification.responder(true);
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
  h3 {
    margin-bottom: 20px;
    font-size: 14px;
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

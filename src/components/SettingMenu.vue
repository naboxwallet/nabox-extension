<template>
  <transition name="setting-menu">
    <div class="setting-wrap" v-show="visiable">
      <div class="mask" @click="close"></div>
      <div class="settings-modal shadow">
        <div class="common-pd setting-item" @click="viewOnBrowser">
          展开视图
        </div>
        <div class="common-pd switch-account border">
          {{ $t("header.header4") }}
          <el-button type="warning" class="fr" @click="$router.push('/lock')">
            {{ $t("public.lock") }}
          </el-button>
        </div>
        <div class="border">
          <div class="account setting-item common-pd" :class="{ active: item.selection }"
               v-for="item in accountList" :key="item.pub" @click="switchAccount(item.pub)">
            <p class="border">
              <span class="circle"></span>
              <span class="overflow">{{ item.name }}</span>
              <font>${{ item["balance_" + $store.state.network] }}</font>
            </p>
          </div>
        </div>
        <div class="border">
          <div class="setting-item common-pd" @click="newAddress('create')">
            <div class="border">{{ $t("header.header5") }}</div>
          </div>
          <div class="setting-item common-pd" @click="newAddress('import')">
            <div class="border">{{ $t("header.header6") }}</div>
          </div>
          <div class="setting-item common-pd" @click="changePassword()">
            <div>{{ $t("accountManage.accountManage4") }}</div>
          </div>
        </div>
        <div class="common-pd setting-item border" @click="switchLang">
          {{ $t("header.header3") }}
        </div>
        <div class="common-pd version setting-item">
          {{ $t("header.header7") }}{{ version }}
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
  import axios from "axios";
  import ExtensionPlatform from "@/utils/extension";

  export default {
    data() {
      return {
        currentAccount: 0,
        version: "",
      };
    },
    props: {
      visiable: Boolean
    },
    computed: {
      accountList() {
        return this.$store.state.accountList;
      }
    },
    mounted() {
      this.version = chrome.app.getDetails().version;
      // console.log(chrome.runtime.getManifest(), 666)
      // this.getVersion();
    },
    methods: {

      getVersion() {
        axios.get(chrome.extension.getURL("manifest.json")).then(res => {
          if (res.data.app_version) {
            this.version = res.data.app_version;
            console.log(chrome.app.getDetails(), 666);
            const latest = chrome.app.getDetails().version;
            console.log(latest, 888);
            if (latest !== res.data.app_version) {
              this.update = true;
            }
          }
        });
      },

      async switchAccount(pub) {
        const accountList = [...this.accountList];
        accountList.map(item => {
          item.selection = false;
          if (item.pub === pub) {
            item.selection = true;
          }
        });
        this.close();
        this.$store.dispatch("setAccount", accountList);
      },

      viewOnBrowser() {
        ExtensionPlatform.openExtensionInBrowser();
      },

      switchLang() {
        const lang = this.$i18n.locale === "cn" ? "en" : "cn";
        this.$i18n.locale = lang;
        localStorage.setItem("lang", lang);
        this.close();
      },

      close() {
        this.$emit("update:visiable", false);
      },

      newAddress(type) {
        this.close();
        this.$router.push({
          path: "/new-address",
          query: {type}
        });
      },

      changePassword() {
        this.close();
        this.$router.push({
          path: "/change-password",
        });
      },


    }
  };
</script>

<style lang="less">
  @import "../assets/css/style.less";

  @color: #6d757c;

  .setting-wrap {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 9999;
  }

  .mask {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.2);
  }

  .settings-modal {
    position: absolute;
    top: 55px;
    right: 18px;
    width: 260px;
    border-radius: 15px;
    background-color: #fff;
    overflow: hidden;
    // box-shadow: 0 0 10px 0px rgba(0, 0, 0, 0.2);
    .common-pd {
      padding: 0 20px;
      font-size: 14px;
      line-height: 45px;
    }
    .setting-item {
      cursor: pointer;
      &:hover {
        background-color: #f5f7fa;
      }
    }
    .switch-account {
      cursor: initial;
      color: @color;
      .el-button {
        padding: 5px 15px;
        margin: 8px -10px 0 0;
      }
    }
    .account {
      .circle {
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        margin-right: 6px;
        background-color: @Ncolour;
        opacity: 0;
        vertical-align: middle;
      }
      .overflow {
        display: inline-block;
        max-width: 55%;
        vertical-align: middle;
        margin-right: 5px;
      }
      &.active {
        span {
          opacity: 1;
        }
      }
      &:last-of-type .border {
        border: none;
      }
    }
  }

  .border {
    border-bottom: 1px solid #e9ebf3;
  }

  .setting-menu-leave-active,
  .setting-menu-enter-active {
    transition: all 0.3s;
  }

  .setting-menu-enter {
    opacity: 0;
  }

  .setting-menu-leave-to {
    opacity: 0;
  }

  .alter-pass {
    background-color: rgba(0, 0, 0, 0.8);
    position: absolute;
    width: 100%;
    height: 100%;
    .el-form--label-top {
      width: 80%;
      margin: 20% auto 0;
      .el-button {
        width: 40%;
        margin-top: 10px;
        height: 35px;
        border-radius: 20px;
        font-size: 12px;
      }
    }
  }

</style>

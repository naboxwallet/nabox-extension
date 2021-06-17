<template>
  <transition name="setting-menu">
    <div class="setting-wrap" v-show="visiable">
      <div class="mask" @click="close"></div>
      <div class="settings-modal shadow">
        <div class="common-pd switch-account border">
          <span class="clicks" @click="viewOnBrowser">{{$t('public.onTheView')}}</span>
          <el-button type="warning" class="fr" @click="lock">
            {{ $t("public.lock") }}
          </el-button>
        </div>
        <div class="border cb">
          <div class="setting-item common-pd" @click="changePassword()">
            <div>{{ $t("accountManage.accountManage4") }}</div>
          </div>
        </div>
        <div class="common-pd setting-item border" @click="switchLang">{{ $t("header.header3") }}</div>
        <el-collapse v-model="activeNames" class="using">
          <el-collapse-item :title="$t('home.home16')" name="1">
            <div class="u-list" @click="toUrl('https://nabox.io')">{{$t('home.home17')}}</div>
            <div class="u-list" @click="toUrl('https://forms.gle/XFMrcYQLhapYyLaSA')">{{$t('home.home18')}}</div>
            <div class="u-list" @click="toUrl('https://bbs.nuls.io/t/nabox-chrome-plugin-issues-nabox/4711')">
              {{$t('home.home19')}}
            </div>
            <div class="u-list" @click="toUrl('https://discord.com/invite/mQVXZJXMkn')">Discord</div>
          </el-collapse-item>
        </el-collapse>

        <div class="common-pd version setting-item">{{ $t("header.header7") }}{{ version }}</div>
      </div>
    </div>
  </transition>
</template>

<script>
  import axios from "axios";
  import {getStorage} from "@/utils/util";
  import ExtensionPlatform from "@/utils/extension";

  export default {
    data() {
      return {
        currentAccount: 0,
        version: "",
        activeNames: "",
      };
    },
    props: {
      visiable: Boolean
    },
    computed: {
      accountList() {
        //console.log(this.$store.state.accountList,"setting");
        return this.$store.state.accountList;
      }
    },
    mounted() {
      this.version = chrome.app.getDetails().version;
    },
    methods: {

      //获取版本号
      getVersion() {
        axios.get(chrome.extension.getURL("manifest.json")).then(res => {
          if (res.data.app_version) {
            this.version = res.data.app_version;
            const latest = chrome.app.getDetails().version;
            if (latest !== res.data.app_version) {
              this.update = true;
            }
          }
        });
      },

      //切换账户
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

      //选择语言
      switchLang() {
        const lang = this.$i18n.locale === "cn" ? "en" : "cn";
        this.$i18n.locale = lang;
        localStorage.setItem("lang", lang);
        this.close();
      },

      close() {
        this.activeNames = '';
        this.$emit("update:visiable", false);
      },

      //创建地址
      newAddress(type) {
        this.close();
        this.$router.push({
          path: "/new-address",
          query: {type}
        });
      },

      //修改密码
      changePassword() {
        this.close();
        this.$router.push({
          path: "/change-password",
        });
      },

      //问题反馈
      toUrl(url) {
        this.close();
        window.open(url);
      },

      //锁定
      async lock() {
        const nabox = await getStorage("nabox", {});
        nabox.lock = true;
        ExtensionPlatform.set({nabox});
        this.$router.push({
          path: "/lock",
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
    .using {
      border-top: 0;
      .el-collapse-item {
        .el-collapse-item__header {
          margin: 0 0 0 20px;
          font-family: DINOT, Roboto;
          color: #3a3c44;
          font-weight: 400;
          font-size: 14px;
        }
        .el-collapse-item__content {
          padding: 0;
          .u-list {
            font-family: DINOT, Roboto;
            color: #3a3c44;
            font-weight: 400;
            margin: 0 20px;
            padding: 0 40px;
            border-bottom: 1px solid #e9ebf3;
            cursor: pointer;
            line-height: 30px;
          }
        }

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

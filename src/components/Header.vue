<template>
  <div class="header-bar">
    <div class="header-left fl">
      <div class="header-logo fl">
        <img src="../assets/img/logo.svg" @click="$router.push({ name: 'Home' })"/>
      </div>
      <div class="header-note fr">
        <!-- <p class="clicks" @click="toUrl('/account-manage')">{{accountName}}</p>-->
        <p class="clicks" @click="showAccount = true">{{accountName}}</p>
      </div>
    </div>

    <div class="header-right fr">
      <div class="header-menu">
        <el-select v-model="curNet" :popper-append-to-body="false">
          <el-option v-for="(item, index) in networkList" :key="item.value" :label="networkLabel[index]"
                     :value="item.value">
            <div class="option-item">
              <span class="icon-area"><i v-if="item.value === network"></i></span>
              <span class="item-label">{{ networkLabel[index] }}</span>
              <span class="expand" @click.stop="item.expand = !item.expand">
            </span>
            </div>
          </el-option>
        </el-select>
        <span @click="showSettings = true" class="iconfont iconshezhi setting-logo"></span>
      </div>
    </div>

    <div class="cb header-bar-bottom">
      <div class="fl">
        <div class="title clicks" @click="$emit('show-asset-modal')">
          {{$t('public.accountOverview')}}
          <span class="iconfont iconzichan"></span>
        </div>
        <div class="info">${{proportionData.total}}</div>
      </div>
      <div class="fr header-bar-use clicks" @click="$emit('show-app-modal')">
        <span class="iconfont iconyingyong"></span>
        <span>{{ $t("home.home1") }}</span>
      </div>
    </div>

    <setting-menu :visiable.sync="showSettings">
    </setting-menu>
    <Account :visiable.sync="showAccount">
    </Account>

  </div>
</template>

<script>
  import SettingMenu from "./SettingMenu";
  import Account from "./Account";

  export default {
    data() {
      return {
        curNet: "",
        networkList: [],
        showSettings: false,//显示设置弹框
        showAccount: false,//显示账户弹框
      };
    },
    props: {
      network: String,
      accountName: String,
      proportionData: Object
    },
    components: {
      SettingMenu, Account
    },
    watch: {
      network: {
        immediate: true,
        handler(val) {
          this.curNet = val;
        }
      },
      curNet(val) {
        if (val && val !== this.network) {
          this.$emit("changeNetwork", val);
        }
      }
    },
    computed: {
      networkLabel() {
        return [this.$t("header.header1"), this.$t("header.header2")];
      }
    },
    created() {
    },
    mounted() {
      this.networkList = [
        {
          value: "main",
          children: ["NULS", "NERVE", "ETH", "BN"],
          expand: false
        },
        {
          value: "beta",
          children: ["NULS", "NERVE", "ETH"],
          expand: false
        }
      ];
    },
    methods: {
      toUrl(path) {
        this.$router.push(path);
      }
    }
  };
</script>

<style lang="less">
  @import "../assets/css/style.less";
  @import "../assets/icon/iconfont.css";

  .header-bar {
    height: 140px;
    width: 100%;
    background-color: #53b8a9;
    padding: 15px 0 0 15px;
    .header-left {
      .header-logo {
        cursor: pointer;
        background-color: #F5F7FA;
        width: 39px;
        height: 39px;
        border-radius: 19.5px;
        img {
          width: 30px;
          margin: 2px 0 0 4px;
        }
      }
      .header-note {
        height: 27px;
        background-color: #6dc3b6;
        border-radius: 12px;
        margin: 6px 0 0 10px;
        max-width: 105px;
        p {
          font-size: 12px;
          color: #fff;
          font-family: DINOT, Roboto;
          line-height: 26px;
          padding: 0 10px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    .header-right {
      margin: 6px 15px 0 0;
      .header-menu {
        flex: 1;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        .el-select {
          width: 100px;
          margin: 0 0 0 30px;
          .el-input {
            .el-input__inner {
              border-radius: 20px;
              font-size: 12px;
              height: 27px;
              line-height: 27px;
              background-color: #53b8a9;
              border-color: #d6eeee;
              color: #fff;
              .el-input__suffix {
                .el-input__icon {
                  line-height: 27px;
                  color: #d6eeee;
                }
              }
            }
          }
        }

        .el-select .el-input .el-input__suffix .el-input__icon {
          line-height: 27px;
          color: #d6eeee;
        }
        .el-select-dropdown {
          min-width: 80px;
          border-radius: 10px;
          box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2);
          background-color: #53b8a9;
          border-color: #d6eeee;
        }
        .el-select-dropdown__item {
          padding: 0;
          height: auto !important;
          color: #ffffff;

          &.selected span {
            //color: @Ncolour;
          }
        }
        .el-select-dropdown__item.hover, .el-select-dropdown__item:hover {
          background-color: #d6eeee;
        }
        .option-item {
          padding: 0 20px;
          display: flex;
          align-items: center;
          .icon-area {
            display: inline-block;
            width: 15px;
            i {
              display: inline-block;
              width: 8px;
              height: 8px;
              border-radius: 100%;
              background-color: #fff;
            }
          }
          .item-label {
            flex: 1;
            font-size: 12px;
            color: #3a3c44;
          }
          .expand {
            width: 30px;
            text-align: right;
            .el-icon-arrow-right {
              color: #d6eeee;
            }
          }
        }
        .expand-wrap {
          padding-left: 40px;
          background-color: #edf6f4;
          cursor: initial;
        }
        .setting-logo {
          width: 20px;
          margin-left: 15px;
          cursor: pointer;
          font-size: 20px;
          color: #fff;
        }
      }
    }

    .header-bar-bottom {
      clear: both;
      .fl {
        margin: 10px 0 0 0;
        .title {
          font-size: 12px;
          font-family: DINOT, Roboto;
          color: #e4f2ef;
          .iconzichan {
            margin: 0 0 0 5px;
            font-size: 10px;
          }
        }
        .info {
          margin: 10px 0 0 0;
          font-size: 24px;
          color: #fff;
          font-weight: bold;
        }
      }
      .header-bar-use {
        margin: 10px 15px 0 0;
        .iconyingyong {
          margin-right: 6px;
          font-size: 10px;
        }
        span {
          font-size: 12px;
          color: #ffffff;
        }
      }
    }

  }
</style>

<template>
  <div class="header-bar">
    <div class="header-logo">
      <img src="../assets/img/logo.svg" @click="$router.push({ name: 'Home' })"/>
    </div>
    <div class="header-menu">
      <el-select v-model="curNet" :popper-append-to-body="false">
        <el-option v-for="(item, index) in networkList" :key="item.value" :label="networkLabel[index]"
                   :value="item.value">
          <div class="option-item">
            <span class="icon-area"><i v-if="item.value === network"></i></span>
            <span class="item-label">{{ networkLabel[index] }}</span>
            <span class="expand" @click.stop="item.expand = !item.expand">
              <i class="el-icon-arrow-right"></i>
            </span>
          </div>
          <el-collapse-transition>
            <div class="expand-wrap" v-show="item.expand" @click.stop="">
              <p v-for="child in item.children" :key="child">{{ child }}</p>
            </div>
          </el-collapse-transition>
        </el-option>
      </el-select>
      <img class="setting-logo" @click="showSettings = true" src="../assets/img/settings.svg"/>
      <setting-menu :visiable.sync="showSettings"/>
    </div>
  </div>
</template>

<script>
  import SettingMenu from "./SettingMenu";

  export default {
    data() {
      return {
        curNet: "",
        networkList: [],
        showSettings: false
      };
    },
    props: {
      network: String
    },
    components: {
      SettingMenu
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
        },
        /*{
          value: "07",
          children: ["NULS", "NERVE", "ETH"],
          expand: false
        }*/
      ];
    },
    methods: {}
  };
</script>

<style lang="less">
  @import "../assets/css/style.less";

  .header-bar {
    display: flex;
    align-items: center;
    height: 70px;
    padding: 0 15px 0 22px;
    box-shadow: 0 3px 4px rgba(135, 134, 134, 0.16);
    .header-logo {
      cursor: pointer;
      img {
        width: 30px;
      }
    }
    .header-menu {
      flex: 1;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      .el-select .el-input .el-input__inner {
        border-radius: 20px;
        font-size: 12px;
      }
      .el-select-dropdown {
        min-width: 160px !important;
        border-radius: 10px;
        box-shadow: 0 0 10px 0px rgba(0, 0, 0, 0.2);
      }
      .el-select-dropdown__item {
        padding: 0;
        height: auto !important;
        &.selected span {
          color: @Ncolour;
        }
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
            background-color: @Ncolour;
          }
        }
        .item-label {
          flex: 1;
          font-size: 12px;
        }
        .expand {
          width: 30px;
          text-align: right;
        }
      }
      .expand-wrap {
        padding-left: 40px;
        background-color: #edf6f4;
        cursor: initial;
      }
      .setting-logo {
        width: 20px;
        margin-left: 40px;
        cursor: pointer;
      }
    }
  }
</style>

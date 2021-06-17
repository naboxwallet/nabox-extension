<template>
  <div class="home-assets">
    <div class="left">
      <ul>
        <li v-for="item in assets" :key="item.chain">
          <span class="iconfont" v-if="item.running" :class="chain === item.chain ? 'is-active '+ item.icon : item.icon"
                @click="handleChange(item.chain)">
          </span>
          <el-tooltip v-else placement="right" effect="light">
            <div slot="content">{{$t('home.home20')}}<br/>{{$t('home.home21')}}</div>
            <span class="iconfont" :class="chain === item.chain ? 'is-active '+item.icon : item.icon +' is-disabled'">
            </span>
          </el-tooltip>
        </li>
      </ul>
    </div>
    <div class="right" v-loading="loading" element-loading-spinner="el-icon-loading">
      <div class="right-info">
        <div class="card">
          <div class="address">
            <span class="clicks" @click="copy(accountInfo.address)">{{ superLong(accountInfo.address) }}</span>
            <img class="code clicks" src="./../../assets/img/code.svg" @click="$emit('show-modal')"/>
          </div>
          <div class="asset">{{ $t("home.home6") }}<p>${{ accountInfo.total }}</p></div>
          <div class="btn-wrap">
            <span class="in-chain-transfer" @click="toTransfer(false)">{{ $t("home.home7") }}</span>
            <span class="cross-chain-transfer" @click="toTransfer(true)">{{ $t("home.home8") }}</span>
          </div>
        </div>
        <div class="assets-list">
          <img class="icon" src="./../../assets/img/add.svg" @click="toAddAsset" v-show="isType === 0"/>
          <div class="title">
            <span :class="isType === 0 ? 'is-active':'clicks'" @click="choiceType(0)">{{$t('home.home91')}}</span>
            &nbsp;/&nbsp;
            <span :class="isType === 1 ? 'is-active':'clicks'" @click="choiceType(1)">{{$t('home.home10')}}</span>
          </div>

          <div class="assets-data" v-show="isType === 0">
            <assets-list :list="accountInfo.assetsList" @toDetail="toAssetDetail">
            </assets-list>
          </div>

          <div v-show="isType === 1">
            <tx-list :list="txList" @toDetail="toTxDetail" :total="txTotal" :loading="txLoading"
                     @loadMoreTx="loadMoreTx">
            </tx-list>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import {superLong, copys} from "@/utils/util";
  import AssetsList from "@/components/AssetsList";
  import TxList from "@/components/TxList";

  export default {
    data() {
      return {
        oldAssets: [
          {chain: "Ethereum", icon: 'iconETH', running: true},
          {chain: "BSC", icon: 'iconBSC', running: true},
          {chain: "Heco", icon: 'iconHeco', running: true},
          {chain: "OKExChain", icon: 'iconOKExChain', running: true},
          {chain: "NULS", icon: 'iconNULS', running: true},
          {chain: "NERVE", icon: 'iconNVT', running: true},
        ],
        assets: [],
        changeSymbol: '',
        network: this.$store.state.network,
        cardBackground: "#53b8a9",
        activeTab: "first",
        isType: 0,//显示类型
      };
    },
    props: {
      chain: String,
      chainList: {
        type: Object,
        default: () => {
        }
      },
      accountInfo: {
        type: Object,
        default: () => {
        }
      },
      txList: {
        type: Array,
        default: () => []
      },
      address: String,
      loading: Boolean,
      txTotal: [String, Number],
      txLoading: Boolean
    },

    components: {
      AssetsList,
      TxList
    },

    watch: {
      "chainList": function (val) {
        if (val) {
          for (let item of this.assets) {
            item.running = val[item.chain].running;
          }
        }
      },
      "$store.state.network": function (val) {
        if (val) {
          this.assets = [];
          this.getAssets();
        }
      }
    },

    computed: {},

    directives: {
      hover: {
        bind: function (el, binding) {
          el.onmouseover = function () {
            el.src = binding.value;
          };
          el.onmouseleave = function () {
            const originSrc = el.getAttribute("data-src");
            el.src = originSrc;
          };
        }
      }
    },

    mounted() {
      setTimeout(() => {
        this.getAssets();
      }, 50);
    },

    methods: {

      //获取链列表
      getAssets() {
        let config = JSON.parse(localStorage.getItem('config'));
        if (!config) {
          setTimeout(() => {
            this.getAssets();
          }, 50);
          return;
        }
        let assetsList = Object.keys(config[this.$store.state.network]);
        for (let item of this.oldAssets) {
          for (let k of assetsList) {
            if (item.chain === k) {
              this.assets.push(item)
            }
          }
        }
        //this.$emit("changeSymbol", this.assets[0].chain)
      },

      superLong(str, len = 9) {
        return superLong(str, len);
      },

      /**
       * @disc: 选择显示类型
       * @params: type 0:资产 1:交易记录
       * @date: 2021-01-28 11:17
       * @author: Wave
       */
      choiceType(type) {
        this.isType = type;
      },

      handleChange(chain) {
        this.changeSymbol = chain;
        this.$emit("changeSymbol", chain);
      },

      copy(str) {
        copys(str);
        this.$message({message: this.$t("public.copySuccess"), type: "success", duration: 1000});
      },

      toAssetDetail(info) {
        let params = info.contractAddress ? {contractAddress: info.contractAddress} : {
          assetChainId: info.chainId,
          assetId: info.assetId
        };
        this.$emit("toAssetDetail", params);
      },

      toTxDetail(item) {
        this.$emit("toTxDetail", item);
      },

      toTransfer(cross) {
        const path = cross ? "/cross-chain-transfer" : "inner-transfer";
        this.$emit("toTransfer", path);
      },

      toAddAsset() {
        this.$emit("toAddAsset");
      },

      loadMoreTx() {
        this.$emit("loadMoreTx");
      },
    }
  };
</script>

<style lang="less" scoped>
  .home-assets {
    display: flex;
    //padding-top: 20px;
    //height: calc(100% - 187px);
    height: 100%;

    .left {
      padding: 30px 2.5px 0;
      background-color: #f6fbfb;
      float: left;
      display: flex;
      li {
        width: 35px;
        height: 35px;
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
        &:last-child {
          .iconfont {
            padding: 2px 0 0 1.4px;
          }
        }
        .iconfont {
          display: block;
          font-size: 14px;
          color: #bac0d3;
          cursor: pointer;
          width: 20px;
          height: 20px;
          border-radius: 25px;
          padding: 2px 0 0 2px;
          border: 1px solid #bac0d3;
        }
        .is-active {
          background-color: #53b8a9;
          border-color: #53b8a9;
          font-size: 20px;
          color: #fff;
          width: 26px;
          height: 26px;
          border-radius: 26px;
          padding: 2px 0 0 2px;
        }
        .is-disabled {
          background-color: #d3d3d3;
          color: #f2f2f2;
          border-color: #d3d3d3;
        }
      }
    }
    .right {
      height: 33rem;
      width: 100%;
      overflow: auto;
      padding: 0 15px 0;
      background-color: #ffffff;
      float: right;
      .right-info {
        overflow: auto;
        height: 670px
      }
      .card {
        padding: 15px 20px;
        height: 164px;
        border-radius: 2px;
        line-height: 18px;
        background-color: #f6fbfb;
        border-top: 4px solid #49cdba;
        margin: 30px 0;
        .address {
          font-size: 13px;
          margin-bottom: 8px;
          font-family: DINOT, Roboto;
          color: #8f95a8;
          .clicks {
            &:hover {
              background-color: #f6fbbb;
            }
          }
          img {
            margin: 2px 0 0 0;
            width: 13px;
            position: relative;
            float: right;
          }
        }
        .asset {
          font-size: 10px;
          color: #bac0d3;
          p {
            padding: 5px 0;
            font-size: 21px;
            margin: 5px 0;
            color: #333333;
            font-weight: bold;
          }
        }
        .btn-wrap {
          margin-top: 15px;
          span {
            display: inline-block;
            width: 110px;
            height: 39px;
            line-height: 39px;
            font-size: 14px;
            text-align: center;
            border-radius: 20px;
            cursor: pointer;
            background-color: #49cdba;
            color: #fff;
            &:first-child {
              margin-right: 20px;
            }
          }
        }
      }
      .assets-list {
        position: relative;
        .icon {
          width: 20px;
          position: absolute;
          z-index: 1;
          right: 0;
          top: 4px;
          cursor: pointer;
        }
        .title {
          color: #bac0d3;
          span {
            font-size: 12px;
            color: #bac0d3;
          }
          .is-active {
            font-size: 16px;
            color: #3a3c44;
          }
        }

        .assets-data {
          margin: 25px 0 0 0;
        }

        /deep/ .el-tabs {
          .el-tabs__header {
            margin-bottom: 1px;
          }
          .el-tabs__item {
            padding: 0 10px;
            color: #6d757c;
            height: 36px;
            &.is-active {
              color: #53b8a9;
            }
            &:hover {
              color: #53b8a9;
              cursor: pointer;
            }
            &:nth-child(2) {
              padding-left: 0;
            }
            &:last-child {
              padding-right: 0;
            }
          }
        }
        .asset-list,
        .tx-list {
          height: 390px;
        }
      }
    }
  }
</style>

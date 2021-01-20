<template>
  <div class="home-assets">
    <div class="left">
      <ul>
        <li v-for="item in assets" :key="item.chain">
          <img v-show="chain === item.chain" :src="item.activeSrc"/>
          <img v-show="chain !== item.chain" :src="item.src" v-hover="item.activeSrc" :data-src="item.src"
               @click="handleChange(item.chain, item.background)"/>
        </li>
      </ul>
    </div>
    <div class="right" v-loading="loading">
      <div class="card" :style="{ background: cardBackground }">
        <div class="address">
          <span>{{ superLong(accountInfo.address) }}</span>
          <span class="fr">
            <i class="iconfont icon-copy clicks" @click="copy(accountInfo.address)"></i>
            <i class="iconfont icon-system-active clicks" @click="$emit('show-modal')"></i>
          </span>
        </div>
        <div class="asset">{{ $t("home.home6") }}<p>${{ accountInfo.total }}</p></div>
        <div class="btn-wrap">
          <span class="in-chain-transfer" @click="toTransfer(false)">{{ $t("home.home7") }}</span>
          <span class="cross-chain-transfer" @click="toTransfer(true)">{{ $t("home.home8") }}</span>
        </div>
      </div>
      <div class="assets-list">
        <i class="el-icon-circle-plus-outline" @click="toAddAsset"></i>
        <el-tabs v-model="activeTab">
          <el-tab-pane :label="$t('home.home9')" name="first">
            <assets-list :list="accountInfo.assetsList" @toDetail="toAssetDetail">
            </assets-list>
          </el-tab-pane>
          <el-tab-pane :label="$t('home.home10')" name="second">
            <tx-list :list="txList" @toDetail="toTxDetail" :total="txTotal" :loading="txLoading"
                     @loadMoreTx="loadMoreTx">
            </tx-list>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script>
  import {superLong, copys} from "@/utils/util";
  import NULS from "../../assets/img/NULS.png";
  import NULSActive from "../../assets/img/NULS-active.png";
  import Nerve from "../../assets/img/Nerve.png";
  import NerveActive from "../../assets/img/Nerve-active.png";
  import ETH from "../../assets/img/ETH.png";
  import ETHActive from "../../assets/img/ETH-active.png";
  import BNB from "../../assets/img/BNB.png";
  import BNBActive from "../../assets/img/BNB-active.png";
  import Heco from "../../assets/img/Heco.png";
  import HecoActive from "../../assets/img/Heco-active.png";
  import AssetsList from "@/components/AssetsList";
  import TxList from "@/components/TxList";

  export default {
    data() {
      return {
        assets: [
          {chain: "Ethereum", background: "#292e39", src: ETH, activeSrc: ETHActive},
          {chain: "BSC", background: "#e7ba41", src: BNB, activeSrc: BNBActive},
          {chain: "Heco", background: "#26356c", src: Heco, activeSrc: HecoActive},
          {chain: "NULS", background: "#53b8a9", src: NULS, activeSrc: NULSActive},
          {chain: "NERVE", background: "#5270b5", src: Nerve, activeSrc: NerveActive},
        ],
        cardBackground: "#53b8a9",
        activeTab: "first"
      };
    },
    props: {
      chain: String,
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

    watch: {},

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
      const current = this.assets.filter(v => v.chain === this.chain)[0];
      if (current) {
        this.cardBackground = current.background;
      }
    },

    methods: {
      superLong(str, len = 7) {
        return superLong(str, len);
      },
      handleChange(chain, background) {
        this.cardBackground = background;
        this.$emit("changeSymbol", chain);
      },
      copy(str) {
        copys(str);
        this.$message({
          message: this.$t("public.copySuccess"),
          type: "success",
          duration: 1000
        });
      },
      toAssetDetail(info) {
        let params = info.contractAddress
          ? {contractAddress: info.contractAddress}
          : {assetChainId: info.chainId, assetId: info.assetId};
        this.$emit("toAssetDetail", params);
      },
      toTxDetail(item) {
        this.$emit("toTxDetail", item);
      },
      toTransfer(cross) {
        const path = cross ? "/cross-chain-transfer" : "in-chain-transfer";
        this.$emit("toTransfer", path);
      },
      toAddAsset() {
        this.$emit("toAddAsset");
      },
      loadMoreTx() {
        this.$emit("loadMoreTx");
      }
    }
  };
</script>
<style lang="less" scoped>
  .home-assets {
    display: flex;
    padding-top: 20px;
    height: calc(100% - 187px);
    .left {
      padding: 0 5px;
      li {
        width: 55px;
        display: flex;
        justify-content: center;
        margin-bottom: 15px;
        img {
          display: block;
          width: 28px;
          cursor: pointer;
        }
      }
    }
    .right {
      flex: 1;
      padding: 0 15px;
      border-left: 1px solid #e9ebf3;
      .card {
        padding: 15px 20px;
        height: 150px;
        border-radius: 15px;
        line-height: 18px;
        margin-bottom: 10px;
        * {
          color: #fff;
        }
        .address {
          font-size: 16px;
          margin-bottom: 8px;
          i {
            font-size: 18px;
            margin-left: 6px;
          }
        }
        .asset {
          font-size: 14px;
          color: #f4f4f4;
          p {
            font-size: 18px;
            margin: 5px 0;
            color: #fff;
          }
        }
        .btn-wrap {
          margin-top: 15px;
          span {
            display: inline-block;
            width: 92px;
            height: 32px;
            line-height: 32px;
            font-size: 12px;
            text-align: center;
            border: 1px solid #fff;
            border-radius: 20px;
            cursor: pointer;
            &:first-child {
              margin-right: 30px;
            }
          }
        }
      }
      .assets-list {
        position: relative;
        .el-icon-circle-plus-outline {
          position: absolute;
          z-index: 1;
          right: 0;
          top: 8px;
          font-size: 20px;
          cursor: pointer;
          color: #53b8a9;
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
        /deep/ .asset-list,
        /deep/ .tx-list {
          height: 190px;
        }
      }
    }
  }
</style>

<template>
  <div class="asset-info" v-loading="loading">
    <div class="hea">
      <common-head>
      </common-head>
    </div>

    <div class="asset-ins">
      <div class="title-info">
        <div class="icons"><img :src="assetInfo.icon" alt=""/></div>
        <div class="symbols">{{ assetInfo.symbol }}</div>
      </div>
      <div class="content">
        <div>
          <div class="info-overview">
            <div>
              <span>{{ $t("public.total") }}</span>
              <span>{{ assetInfo.total }}</span>
            </div>
            <div>
              <span>{{ $t("public.available") }}</span>
              <span>{{ assetInfo.balance }}</span>
            </div>
            <div>
              <span>{{ $t("public.lock") }}</span>
              <span>{{ assetInfo.locked }}</span>
            </div>
          </div>
          <div class="btn-wrap">
            <el-button @click="toTransfer(false)">{{ $t("home.home7") }}</el-button>
            <el-button @click="toTransfer(true)">{{ $t("home.home8") }}</el-button>
          </div>
        </div>
        <tx-list :list="txList" @toDetail="toTxDetail" :total="txTotal" :loading="txLoading"
                 @loadMoreTx="getAssetTxList">
        </tx-list>
      </div>
    </div>

  </div>
</template>

<script>
  import CommonHead from "@/components/CommonHead";
  import TxList from "@/components/TxList";
  import {divisionDecimals} from "@/utils/util";

  export default {
    data() {
      this.pageNumber = 1;
      this.pageSize = 10;
      return {
        loading: true,
        assetInfo: {},
        txList: [],
        txTotal: 0,
        txLoading: true
      };
    },
    components: {
      CommonHead,
      TxList
    },
    watch: {},
    computed: {},
    created() {
      this.getAssetDetail();
      this.getAssetTxList();
    },
    mounted() {
    },
    methods: {

      async getAssetDetail(refresh = false) {
        const {chain, address, assetChainId: chainId, assetId, contractAddress} = this.$route.query;
        const params = contractAddress ? {contractAddress} : {chainId, assetId};
        const res = await this.$request({url: "/wallet/address/asset", data: {chain, address, refresh, ...params}});
        if (res.code === 1000) {
          res.data.total = divisionDecimals(res.data.total, res.data.decimals);
          res.data.balance = divisionDecimals(res.data.balance, res.data.decimals);
          res.data.locked = divisionDecimals(res.data.locked, res.data.decimals);
          this.assetInfo = res.data;
          this.loading = false;
        }
      },

      async getAssetTxList() {
        const {chain, address, assetChainId: chainId, assetId, contractAddress} = this.$route.query;
        const params = contractAddress ? {contractAddress} : {chainId, assetId};
        this.txLoading = true;
        if ((this.pageNumber - 1) * this.pageSize > this.txTotal) {
          this.txLoading = false;
          return;
        }
        const res = await this.$request({
          url: "/tx/coin/list",
          data: {chain, address, pageNumber: this.pageNumber++, pageSize: this.pageSize++, ...params}
        });
        if (res.code === 1000) {
          //console.log(res.data, 6);
          res.data.records.map(v => {
            //v.createTime = formatTime(v.createTime * 1000);
            v.amount = divisionDecimals(v.amount, v.decimals);
            v.chainInfo = this.chain
          });
          this.txList = this.txList.concat(...res.data.records);
          this.txTotal = res.data.total;
          this.txLoading = false;
        }
      },

      toTransfer(cross) {
        const path = cross ? "/cross-chain-transfer" : "inner-transfer";
        const {chain, address, assetChainId, assetId, contractAddress} = this.$route.query;
        const params = contractAddress ? {contractAddress} : {assetChainId, assetId};
        //console.log(params);
        this.$router.push({
          path,
          query: {chain, address, ...params}
        });
      },

      toTxDetail(item) {
        this.$router.push({
          path: "/transfer-info",
          query: {
            chain: this.$route.query.chain,
            txHash: item.hash,
            transCoinId: item.id
          }
        });
      }
    }
  };
</script>

<style lang='less' scoped>
  .asset-info {
    height: 100%;
    .hea {
      position: fixed;
      height: 70px;
      z-index: 66;
      background-color: #f2f3f4;
      width: 350px;
    }
    .asset-ins {
      //margin: 50px 0 0 0;
      overflow: auto;
      height: 770px;
      position: absolute;
      margin: 60px 0 0 0;
      .title-info {
        width: 50px;
        text-align: center;
        margin: 0 auto 0;
        position: relative;
        z-index: 888;
        .icons {
          img {
            width: 45px;
          }
        }
        .symbols {
          font-weight: 600;
          font-size: 16px;
          margin-top: 5px;
        }
      }
      .content {
        padding: 20px 25px 0;
      }
      .info-overview {
        div {
          display: flex;
          align-items: center;
          justify-content: space-between;
          line-height: 1;
          margin-bottom: 15px;
          span:first-child {
            color: #a5abb2;
          }
        }
      }
      .btn-wrap {
        padding: 5px 0 20px;
        text-align: center;
        border-bottom: 1px solid #e9ebf3;
        .el-button {
          display: inline-block;
          width: 140px;
          height: 44px;
          font-size: 14px;
          text-align: center;
          border-radius: 20px;
          cursor: pointer;
          background-color: #49cdba;
          border: 1px solid #49cdba;
          color: #fff;
          & + .el-button {
            margin-left: 20px;
          }
        }
      }
      /deep/ .tx-list {
        height: 500px;
      }
    }

  }
</style>

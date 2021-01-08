<template>
  <div class="asset-info" v-loading="loading">
    <common-head>
      <template>
        <div class="title-info">
          <img :src="assetInfo.icon" alt="" />
          <span>{{ assetInfo.symbol }}</span>
        </div>
      </template>
    </common-head>
    <div class="content">
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
      <tx-list
        :list="txList"
        @toDetail="toTxDetail"
        :total="txTotal"
        :loading="txLoading"
        @loadMoreTx="getAssetTxList"
      ></tx-list>
    </div>
  </div>
</template>

<script>
import CommonHead from "@/components/CommonHead";
import TxList from "@/components/TxList";
import { formatTime, divisionDecimals } from "@/utils/util";
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

  mounted() {},

  methods: {
    async getAssetDetail() {
      const {
        chain,
        address,
        assetChainId: chainId,
        assetId,
        contractAddress
      } = this.$route.query;
      const params = contractAddress
        ? { contractAddress }
        : { chainId, assetId };
      const res = await this.$request({
        url: "/wallet/address/asset",
        data: { chain, address, ...params }
      });
      if (res.code === 1000) {
        res.data.total = divisionDecimals(res.data.total, res.data.decimals);
        res.data.balance = divisionDecimals(res.data.balance, res.data.decimals);
        res.data.locked = divisionDecimals(res.data.locked, res.data.decimals);
        this.assetInfo = res.data;
        this.loading = false;
      }
    },
    async getAssetTxList() {
      const {
        chain,
        address,
        assetChainId: chainId,
        assetId,
        contractAddress
      } = this.$route.query;
      const params = contractAddress
        ? { contractAddress }
        : { chainId, assetId}
      this.txLoading = true;
      if ((this.pageNumber - 1) * this.pageSize > this.txTotal) {
        this.txLoading = false;
        return;
      }
      const res = await this.$request({
        url: "/tx/coin/list",
        data: {
          chain,
          address,
          pageNumber: this.pageNumber++,
          pageSize: this.pageSize++,
          ...params
        }
      });
      if (res.code === 1000) {
        console.log(res.data,6)
        res.data.records.map(v => {
          console.log(v, 23)
          v.createTime = formatTime(v.createTime * 1000);
          v.amount = divisionDecimals(v.amount, v.decimals);
        });
        this.txList = this.txList.concat(...res.data.records);
        this.txTotal = res.data.total;
        this.txLoading = false;
      }
    },
    toTransfer(cross) {
      const path = cross ? "/cross-chain-transfer" : "in-chain-transfer";
      const { chain, address, assetChainId, assetId, contractAddress } = this.$route.query;
      const params = contractAddress
        ? { contractAddress }
        : { assetChainId, assetId}
      this.$router.push({
        path,
        query: { chain, address, ...params }
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
  .title-info {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    img {
      width: 30px;
      margin-right: 8px;
    }
    span {
      padding-top: 3px;
      font-weight: 600;
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
      width: 114px;
      height: 35px;
      border-radius: 20px;
      font-size: 12px;
      color: #53b8a9;
      & + .el-button {
        margin-left: 30px;
      }
    }
  }
  /deep/.tx-list {
    height: 350px;
  }
}
</style>
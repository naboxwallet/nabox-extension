<template>
  <div class="transfer-info">
    <common-head>
      {{ $t("transferInfo.transferInfo1") }}
    </common-head>
    <div class="content" v-loading="loading">
      <div class="transfer-item">
        <label>{{ $t("public.symbol") }}</label>
        {{ txInfo.symbol }}
      </div>
      <div class="transfer-item">
        <label>{{ $t("public.amount") }}</label>
        {{ txInfo.amount }}
      </div>
      <div class="transfer-item">
        <label>{{ $t("public.createTime") }}</label>
        {{ txInfo.createTime }}
      </div>
      <template v-if="txInfo.type === 10">
        <div class="transfer-item">
          <label>From</label>
          <div class="from-info">
            <span>NULS账户</span>
            <p class="click">{{ superLong(txInfo.froms) }}</p>
            <span>TXID</span>
            <p class="click">{{ superLong("tNULSeBaMqspYMk6BAcvSWZS3PCSzBsro87imU") }}</p>
          </div>
        </div>
        <div class="transfer-item">
          <label>To</label>
          <div class="to-info">
            <span>NULS账户</span>
            <p class="click">{{ superLong(txInfo.tos) }}</p>
            <span>TXID</span>
            <p class="click">{{ superLong("tNULSeBaMqspYMk6BAcvSWZS3PCSzBsro87imU") }}</p>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="transfer-item" v-if="txInfo.froms">
          <label>From</label>
          <span class="click" @click="toUrl(txInfo.froms, 'address')">
            {{ txInfo.froms }}
          </span>
        </div>
        <div class="transfer-item" v-if="txInfo.tos">
          <label>To</label>
          <span class="click" @click="toUrl(txInfo.tos, 'address')">
            {{ txInfo.tos }}
          </span>
        </div>
        <div class="transfer-item">
          <label>TxID</label>
          <span class="click" @click="toUrl(txInfo.id, 'hash')">
            {{ txInfo.id }}
          </span>
        </div>
      </template>
      <div class="transfer-item">
        <label>{{ $t("public.status") }}</label>
        {{ $t("statusType." + txInfo.status) }}
      </div>
      <div class="transfer-item">
        <label>{{ $t("public.fee") }}</label>
        {{ txInfo.fee }}
      </div>
      <div class="transfer-item">
        <label>{{ $t("public.remark") }}</label>
        {{ txInfo.remark }}
      </div>
    </div>
  </div>
</template>

<script>
import CommonHead from "@/components/CommonHead";
import { formatTime, superLong, divisionDecimals, getOrigin } from "@/utils/util";
export default {
  data() {
    return {
      loading: true,
      txInfo: {}
    };
  },

  components: {
    CommonHead
  },

  watch: {},

  computed: {},

  created() {
    this.getTxInfo();
  },

  mounted() {},

  methods: {
    superLong(str, len = 8) {
      return superLong(str, len);
    },
    async getTxInfo() {
      const { chain, txHash, transCoinId } = this.$route.query;
      const res = await this.$request({
        url: "/tx/coin/info",
        data: { chain, txHash, transCoinId }
      });
      if (res.code === 1000) {
        res.data.amount = divisionDecimals(res.data.amount, res.data.decimals);
        res.data.createTime = formatTime(res.data.createTime * 1000);
        this.txInfo = res.data;
        this.loading = false;
      }
    },
    toUrl(query, type) {
      const chain = this.$route.query.chain;
      const origin = getOrigin(chain, this.$store.state.network);
      let url = "";
      if (chain === "NULS" || chain === "NERVE") {
        if (type === "address") {
          // if (this.txInfo.type === 16) {
          //   url = "/contracts/info?contractAddress=" + query;
          // } else {
          url = "/address/info?address=" + query;
          // }
        } else if (type === "hash") {
          url = "/transaction/info?hash=" + query;
        }
      } else {
        if (type === "address") {
          url = "/address/" + query;
        } else if (type === "hash") {
          url = "/tx/" + query;
        }
      }
      window.open(origin + url);
    }
  }
};
</script>
<style lang="less">
.transfer-info {
  .content {
    padding: 15px 20px 0;
  }
  .transfer-item {
    display: flex;
    margin-bottom: 15px;
    color: #3a3c44;
    line-height: 1.2;
    font-size: 12px;
    label {
      width: 60px;
      color: #a5abb2;
      font-size: 12px;
    }
    .click {
      word-break: break-all;
      flex: 1;
    }
    .from-info, .to-info {
      span {
        color: #6d757c;
        // font-size: 12px;
      }
      p {
        font-size: 14px;
        padding: 5px 0;
      }
    }
  }
}
</style>
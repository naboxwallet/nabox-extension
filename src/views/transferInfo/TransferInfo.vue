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
      <div class="transfer-item">
        <label>{{ $t("public.txType") }}</label>
        {{ $t("type." + txInfo.type) }}
      </div>
      <div class="transfer-tx-info" v-if="txInfo.isMultiCross">
        <div class="from">
          <p class="label">From</p>
          <div class="transfer-info">
            <span>{{ txInfo.fromChain }}</span>
            <p
              class="click"
              @click="toUrl(txInfo.fromAddress, 'address', txInfo.fromChain)"
            >
              {{ superLong(txInfo.fromAddress) }}
            </p>
          </div>
          <div class="transfer-info">
            <span>TXID</span>
            <p class="click" @click="toUrl(txInfo.fromHash, 'hash', txInfo.fromChain)">
              {{ superLong(txInfo.fromHash) }}
            </p>
          </div>
        </div>
        <div class="to">
          <p class="label">To</p>
          <div class="transfer-info">
            <span>{{ txInfo.toChain }}</span>
            <p class="click" @click="toUrl(txInfo.toAddress, 'address', txInfo.toChain)">
              {{ superLong(txInfo.toAddress) }}
            </p>
          </div>
          <div class="transfer-info">
            <span>TXID</span>
            <p class="click" @click="toUrl(txInfo.toHash, 'hash', txInfo.toChain)">
              {{ superLong(txInfo.toHash) }}
            </p>
          </div>
        </div>
      </div>
      <template v-else>
        <div class="transfer-item">
          <label>From</label>
          <span class="click" @click="toUrl(txInfo.fromAddress, 'address')">
            {{ superLong(txInfo.fromAddress) }}
          </span>
        </div>
        <div class="transfer-item">
          <label>To</label>
          <span class="click" @click="toUrl(txInfo.toAddress, 'address')">
            {{ superLong(txInfo.toAddress) }}
          </span>
        </div>
        <div class="transfer-item">
          <label>TxID</label>
          <span class="click" @click="toUrl(txInfo.hash, 'hash')">
            {{ superLong(txInfo.hash) }}
          </span>
        </div>
      </template>
      <div class="transfer-item">
        <label>{{ $t("public.status") }}</label>
        {{
          txInfo.isMultiCross
            ? $t("crossStatusType." + txInfo.crossStatus)
            : $t("statusType." + txInfo.status)
        }}
      </div>
      <div class="transfer-item">
        <label>{{ $t("public.fee") }}</label>
        {{ txInfo.fee }}
      </div>
      <div class="transfer-item remark-wrap">
        <label>{{ $t("public.remark") }}</label>
        <span>{{ txInfo.remark }}</span>
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
    superLong(str, len = 12) {
      return superLong(str, len);
    },
    async getTxInfo() {
      const { chain, txHash, transCoinId } = this.$route.query;
      const res = await this.$request({
        url: "/tx/coin/info",
        data: { chain, txHash, transCoinId }
      });
      // const txInfo = {};
      if (res.code === 1000) {
        const data = res.data;
        const commonInfo = {
          amount: divisionDecimals(data.tx.amount, data.tx.decimals),
          createTime: formatTime(data.tx.createTime * 1000),
          fee: data.tx.fee,
          symbol: data.tx.symbol,
          remark: data.tx.remark,
          type: data.tx.type
        };
        let txInfo = {};
        if (data.crossTx) {
          txInfo = {
            fromChain: data.crossTx.fromChain,
            fromAddress: data.crossTx.fromAddress,
            fromHash: data.crossTx.txHash,
            // fromStatus: data.crossTx.status,
            toChain: data.crossTx.toChain,
            toAddress: data.crossTx.toAddress,
            toHash: data.crossTx.crossTxHash,
            // toStatus: data.crossTx.status,
            crossStatus: data.crossTx.status,
            isMultiCross: true,
            ...commonInfo
          };
        } else {
          txInfo = {
            fromAddress: data.tx.froms,
            toAddress: data.tx.tos,
            hash: data.tx.id,
            status: data.tx.status,
            ...commonInfo
          };
        }
        this.txInfo = txInfo;
        this.loading = false;
      }
    },
    toUrl(query, type, openChain) {
      const chain = openChain || this.$route.query.chain;
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
  .remark-wrap {
    flex-wrap: wrap;
    span {
      word-break: break-all;
    }
  }
  .transfer-tx-info {
    .from, .to {
      margin-bottom: 12px;
    }
    .label {
      color: #a5abb2;
      font-size: 12px;
      margin-bottom: 2px;
    }
    .transfer-info {
      display: flex;
      color: #3a3c44;
      line-height: 1.4;
      font-size: 12px;
      align-items: center;
      span {
        width: 60px;
        color: #6d757c;
      }
      p {
        font-size: 14px;
      }
    }
  }

}
</style>
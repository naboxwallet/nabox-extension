<template>
  <div class="cross-txlist">
    <common-head>
      {{ $t("crossTxList.crossTxList1") }}
    </common-head>
    <div class="content">
      <div class="search">
        <el-select v-model="network" :placeholder="$t('public.network')">
          <el-option label="区域一" value="shanghai">
          </el-option>
          <el-option label="区域二" value="beijing">
          </el-option>
        </el-select>
        <el-select v-model="symbol" :placeholder="$t('crossTxList.crossTxList3')">
          <el-option label="区域一" value="shanghai">
          </el-option>
          <el-option label="区域二" value="beijing">
          </el-option>
        </el-select>
        <el-button type="primary">{{$t("crossTxList.crossTxList4")}}
        </el-button>
      </div>
      <tx-list :list="txList" @toDetail="toDetail">
      </tx-list>
    </div>
  </div>
</template>

<script>
  import CommonHead from "@/components/CommonHead";
  import TxList from "@/components/TxList";
  import {formatTime} from "@/utils/util";

  export default {
    data() {
      return {
        network: "",
        symbol: "",
        txList: [
          {
            symbol: "NULS",
            hash: 1,
            createTime: formatTime(1604907486 * 1000),
            from: "TNVTdTSPSLsB7eW65RqZp2WYGDQaUt6yVp3ek",
            to: "TNVTdTSPSLsB7eW65RqZp2WYGDQaUt6yVp3ek",
            amount: -19897.77
          },
          {
            symbol: "NVT",
            hash: 2,
            createTime: 1604207486,
            from: "TNVTdTSPSLsB7eW65RqZp2WYGDQaUt6yVp3ek",
            to: "TNVTdTSPSLsB7eW65RqZp2WYGDQaUt6yVp3ek",
            amount: 19897.77
          },
          {
            symbol: "ETH",
            hash: 3,
            createTime: 1604607486,
            from: "TNVTdTSPSLsB7eW65RqZp2WYGDQaUt6yVp3ek",
            to: "TNVTdTSPSLsB7eW65RqZp2WYGDQaUt6yVp3ek",
            amount: -19897.77
          },
          {
            symbol: "NULS",
            hash: 11,
            createTime: formatTime(1604907486 * 1000),
            from: "TNVTdTSPSLsB7eW65RqZp2WYGDQaUt6yVp3ek",
            to: "TNVTdTSPSLsB7eW65RqZp2WYGDQaUt6yVp3ek",
            amount: -19897.77
          },
          {
            symbol: "NVT",
            hash: 21,
            createTime: 1604207486,
            from: "TNVTdTSPSLsB7eW65RqZp2WYGDQaUt6yVp3ek",
            to: "TNVTdTSPSLsB7eW65RqZp2WYGDQaUt6yVp3ek",
            amount: 19897.77
          },
          {
            symbol: "ETH",
            hash: 31,
            createTime: 1604607486,
            from: "TNVTdTSPSLsB7eW65RqZp2WYGDQaUt6yVp3ek",
            to: "TNVTdTSPSLsB7eW65RqZp2WYGDQaUt6yVp3ek",
            amount: -19897.77
          },
          {
            symbol: "NULS",
            hash: 12,
            createTime: formatTime(1604907486 * 1000),
            from: "TNVTdTSPSLsB7eW65RqZp2WYGDQaUt6yVp3ek",
            to: "TNVTdTSPSLsB7eW65RqZp2WYGDQaUt6yVp3ek",
            amount: -19897.77
          },
          {
            symbol: "NVT",
            hash: 22,
            createTime: 1604207486,
            from: "TNVTdTSPSLsB7eW65RqZp2WYGDQaUt6yVp3ek",
            to: "TNVTdTSPSLsB7eW65RqZp2WYGDQaUt6yVp3ek",
            amount: 19897.77
          },
          {
            symbol: "ETH",
            hash: 32,
            createTime: 1604607486,
            from: "TNVTdTSPSLsB7eW65RqZp2WYGDQaUt6yVp3ek",
            to: "TNVTdTSPSLsB7eW65RqZp2WYGDQaUt6yVp3ek",
            amount: -19897.77
          }
        ]
      };
    },

    components: {
      CommonHead,
      TxList
    },
    watch: {},
    computed: {},
    created() {
    },
    mounted() {
    },
    methods: {

      toDetail(item) {
        console.log(item);
        this.$router.push({
          path: "/transfer-info",
          query: {
            hash: item.hash
          }
        });
      }
    }
  };
</script>
<style lang="less">
  .cross-txlist {
    height: 100%;
    overflow-y: auto;
    .content {
      padding: 0 25px;
      height: calc(100% - 70px);
      .tx-list {
        height: calc(100% - 70px);
      }
    }
  }
</style>

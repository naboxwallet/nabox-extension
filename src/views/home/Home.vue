<template>
  <div class="home">
    <Header :network="network" @changeNetwork="changeNetwork" />
    <Overview
      @show-modal="overviewModal = true"
      :accountName="chainAccount.name"
      :balance="chainAccount['balance_' + $store.state.network]"
    />
    <Assets
      @show-modal="showQrcode"
      :chain="chain"
      :accountInfo="accountInfo"
      :txList="txList"
      :txTotal="txTotal"
      :loading="assetsLoading"
      :txLoading="txLoading"
      @changeSymbol="changeSymbol"
      @toAssetDetail="toAssetDetail"
      @toTxDetail="toTxDetail"
      @toTransfer="toTransfer"
      @toAddAsset="toAddAsset"
      @loadMoreTx="getTxList"
    />
    <Modal
      :visiable.sync="overviewModal"
      class="overview-modal"
      :title="$t('home.home12')"
    >
      <div class="content-head">
        <span>{{ $t("public.symbol") }}</span>
        <span>{{ $t("public.amount") }}</span>
        <span>{{ $t("public.percent") }}</span>
      </div>
      <div class="info">
        <div class="info-item" v-for="(item, index) in list" :key="index">
          <span>{{ item.symbol }}</span>
          <span>{{ item.amount }}</span>
          <span>{{ item.percent }}</span>
        </div>
      </div>
    </Modal>
    <Modal
      :visiable.sync="qrcodeModal"
      class="qr-code-modal"
      :title="chainAccount.name"
    >
      <div id="qrcode" class="qrcode"></div>
      <p class="address">{{ address }}</p>
    </Modal>
  </div>
</template>

<script>
import Header from "@/components/Header";
import Overview from "@/views/home/Overview";
import Assets from "@/views/home/Assets";
import Modal from "@/components/Modal";
import QRCode from "qrcodejs2";
import { divisionDecimals, formatTime } from "@/utils/util";
export default {
  data() {
    this.pageNumber = 1;
    this.pageSize = 10;
    return {
      network: "",
      currentAccount: [],
      overviewModal: false,
      qrcodeModal: false,
      chain: sessionStorage.getItem("chain") || "NULS",
      accountInfo: {},
      txList: [],
      txTotal: 0,
      assetsLoading: true,
      txLoading: true,
      list: [
        {
          symbol: "NULS",
          amount: "$39040.99",
          percent: "27.99%"
        },
        {
          symbol: "NULS",
          amount: "$39040.99",
          percent: "27.99%"
        },
        {
          symbol: "NULS",
          amount: "$39040.99",
          percent: "27.99%"
        },
        {
          symbol: "NULS",
          amount: "$39040.99",
          percent: "27.99%"
        }
      ]
    };
  },
  watch: {
    "$store.state.network": {
      immediate: true,
      handler(val) {
        console.log(val, "network====")
        if (!val) return;
        this.network = val;
        this.changeAccount();
      }
    },
    "$store.getters.currentAccount": {
      handler(val, old) {
        if (!val || val.id === old.id) return;
        this.changeAccount();
      }
    }
  },
  computed: {
    chainAccount() {
      return this.$store.getters.currentAccount
    },
    accountName() {
      const account = this.$store.getters.currentAccount;
      return account ? account.name : "";
    }
  },
  components: {
    Header,
    Overview,
    Assets,
    Modal
  },
  mounted() {
    this.$store.dispatch("setAccount", [...this.$store.state.accountList]);
  },
  methods: {
    changeNetwork(network) {
      this.$store.dispatch("setNetwork", network);
    },
    showQrcode() {
      this.qrcodeModal = true;
      if (document.getElementById("qrcode")) {
        document.getElementById("qrcode").innerHTML = "";
      };
      this.$nextTick(() => {
        this.generateCode();
      });
    },
    generateCode() {
      var qrcode = new QRCode("qrcode", {
        text: this.address,
        width: 130,
        height: 130,
        colorDark: "#000000",
        colorLight: "#ffffff"
      });
    },
    // 切换账户
    changeAccount() {
      const network = this.$store.state.network;
      const accounts = this.$store.getters.currentAccount;
      // console.log(this.$store.state.network, "this.$store.state.network")
      // console.log(this.$store.getters.currentAccount, "this.$store.getters.currentAccount")
      const currentAccount = accounts[network];
      this.currentAccount = currentAccount;
      // console.log(this.currentAccount, 55)
      this.update(this.chain);
    },
    // 切换链网络
    changeSymbol(chain) {
      sessionStorage.setItem("chain", chain);
      this.chain = chain;
      this.update(chain);
    },
    // 更新账户资产列表、交易列表
    async update(chain) {
      this.assetsLoading = true;
      this.txList = [];
      this.pageNumber = 1;
      this.txTotal = 0;
      this.address = this.currentAccount[chain];
      const address = this.currentAccount[chain];
      const res = await this.$request({
        url: "/wallet/address/assets",
        data: { chain, address }
      });
      if (res.code === 1000) {
        let total = 0;
        res.data.map(v => {
          total += Number(v.usdPrice);
          v.total = divisionDecimals(v.total, v.decimals);
        });
        this.accountInfo = {
          address,
          total,
          assetsList: res.data
        };
      } else {
        this.$message({
          message: res.msg,
          type: "error",
          duration: 1000
        });
      }
      this.assetsLoading = false;
      this.getTxList();
    },
    async getTxList() {
      this.txLoading = true;
      if ((this.pageNumber - 1) * this.pageSize > this.txTotal) {
        this.txLoading = false;
        return;
      }
      const res = await this.$request({
        url: "/tx/coin/list",
        data: {
          chain: this.chain,
          address: this.currentAccount[this.chain],
          pageNumber: this.pageNumber++,
          pageSize: this.pageSize
        }
      });
      if (res.code === 1000) {
        res.data.records.map(v => {
          v.createTime = formatTime(v.createTime * 1000);
          v.amount = divisionDecimals(v.amount, v.decimals);
        });
        this.txList = this.txList.concat(...res.data.records);
        this.txTotal = res.data.total;
        this.txLoading = false;
      }
    },
    toAssetDetail(query) {
      const newQuery = {
        address: this.address,
        chain: this.chain,
        ...query
      };
      this.$router.push({
        path: "/asset-info",
        query: { ...newQuery }
      });
    },
    toTxDetail(txData) {
      this.$router.push({
        path: "/transfer-info",
        query: {
          chain: this.chain,
          txHash: txData.hash,
          transCoinId: txData.id
        }
      });
    },
    toTransfer(path) {
      const config = JSON.parse(sessionStorage.getItem("config"));
      const network = this.$store.state.network;
      const { chainId: assetChainId, assetId } = config[network][this.chain];
      const query = {
        address: this.address,
        chain: this.chain,
        assetChainId,
        assetId
      };
      this.$router.push({ path, query });
    },
    toAddAsset() {
      sessionStorage.setItem(
        "visibleAssets",
        JSON.stringify(this.accountInfo.assetsList)
      );
      this.$router.push({
        path: "/add-asset",
        query: {
          address: this.address,
          chain: this.chain
        }
      });
    }
  }
};
</script>

<style lang="less">
.home {
  overflow: hidden;
  height: 100%;
  .overview-modal {
    .inner-content {
      .content-head,
      .info-item {
        display: flex;
        font-size: 12px;
        border-bottom: 1px solid #e9ebf3;
        span {
          flex: 1.2;
        }
        span:nth-child(2) {
          flex: 1.6;
        }
        span:last-child {
          flex: 1;
          text-align: right;
        }
      }
      .content-head {
        height: 40px;
        line-height: 40px;
        color: #6d757c;
      }
      .info-item {
        height: 45px;
        line-height: 45px;
        &:last-child {
          border-bottom: none;
        }
      }
    }
  }
  .qr-code-modal {
    .inner-content {
      padding: 20px;
      #qrcode {
        display: flex;
        justify-content: center;
      }
      .address {
        text-align: center;
        word-break: break-all;
        font-size: 12px;
        margin-top: 20px;
      }
    }
  }
}
</style>

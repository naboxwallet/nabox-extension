<template>
  <div class="home">
    <Header :network="$store.state.network" @changeNetwork="changeNetwork"/>
    <Overview
            @show-app-modal="showAppModal"
            @show-asset-modal="showAssetModal"
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
    <!-- 已连接应用弹窗 -->
    <Modal :visiable.sync="appModal" :title="$t('home.home13')" class="app-modal">
      <div class="sites-wrap">
        <div class="site-item" v-for="site in allowSites" :key="site.origin">
          <div class="left">
            <span class="circle"></span>
            <p class="site-name">{{ site.origin }}</p>
          </div>
          <span class="operate" @click="updateSites(site.origin)">
            {{ $t("home.home14") }}
          </span>
        </div>
        <div v-if="showManualConnect" class="connect-current" @click="toAuthorization">
          {{ $t("home.home15") }}
        </div>
      </div>
    </Modal>
    <!-- 资产总览弹窗 -->
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
    <!-- 二维码弹窗 -->
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
  import {divisionDecimals, formatTime, getStorage, Plus, Division, Times} from "@/utils/util";
  import ExtensionPlatform from "@/utils/extension";

  export default {
    data() {
      this.pageNumber = 1;
      this.pageSize = 10;
      return {
        // network: "",
        currentAccount: [],
        address: "",
        appModal: false,
        allowSites: [], //已连接应用
        currentTab: {}, //当前网站tab信息
        showManualConnect: false,
        overviewModal: false,
        qrcodeModal: false,
        chain: sessionStorage.getItem("chain") || "NULS",
        accountInfo: {},
        txList: [],
        txTotal: 0,
        assetsLoading: true,
        txLoading: true,
        list: [],//资产总览data
        homeSetInterval: null,//定时器
      };
    },
    watch: {
      "$store.state.network": {
        immediate: true,
        handler(val) {
          if (!val) return;
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
        return this.$store.getters.currentAccount;
      },
      accountName() {
        const account = this.$store.getters.currentAccount;
        return account ? account.name : "";
      }
    },
    components: {
      Header, Overview, Assets, Modal
    },
    mounted() {
      this.homeSetInterval = setInterval(() => {
        this.update(this.chain);
      }, 10000)
    },
    destroyed() {
      clearInterval(this.homeSetInterval);
    },
    methods: {
      async changeNetwork(network) {
        const accounts = this.$store.getters.currentAccount;
        const currentAccount = accounts[network];
        this.currentAccount = currentAccount;
        await this.$store.dispatch("setNetwork", network);
        this.update(this.chain);
      },

      async showAppModal() {
        this.appModal = true;
        const nabox = await getStorage("nabox", {});
        this.allowSites = nabox.allowSites || [];
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
          console.log(tabs, 12345)
          if (tabs.length && tabs[0].url) {
            const url = tabs[0].url;
            const origin = url.split("://")[0] + "://" + url.split("://")[1].split("/")[0];
            this.currentTab = {
              domain: origin,
              icon: tabs[0].favIconUrl
            };
            const exist = this.allowSites.filter(v => v.origin === origin)[0]
            this.showManualConnect = exist ? false : true;
          }
        });
      },

      //显示资产总览
      async showAssetModal() {
        this.update(this.chain);
        this.overviewModal = true;
      },

      toAuthorization() {
        this.$router.push({
          path: "/authorization",
          query: this.currentTab
        })
      },

      // 断开已连接网站
      async updateSites(site) {
        const nabox = await getStorage("nabox", {});
        let index = 0;
        this.allowSites.map((v, i) => {
          if (v.origin === site) {
            index = i;
          }
        })
        this.allowSites.splice(index, 1);
        nabox.allowSites = this.allowSites;
        ExtensionPlatform.set({nabox});
        this.appModal = false;
      },

      showQrcode() {
        this.qrcodeModal = true;
        if (document.getElementById("qrcode")) {
          document.getElementById("qrcode").innerHTML = "";
        }
        this.$nextTick(() => {
          this.generateCode();
        });
      },

      generateCode() {
        let qrcode = new QRCode("qrcode", {
          text: this.address,
          width: 130,
          height: 130,
          colorDark: "#000000",
          colorLight: "#ffffff"
        });
      },

      // 切换账户
      async changeAccount() {
        const network = this.$store.state.network;
        const accounts = this.$store.getters.currentAccount;
        const currentAccount = accounts[network];
        this.currentAccount = currentAccount;
        this.update(this.chain);
      },

      // 切换链网络
      changeSymbol(chain) {
        //console.log(chain);
        sessionStorage.setItem("chain", chain);
        this.chain = chain;
        this.update(chain);

        if (this.homeSetInterval) {
          this.homeSetInterval = null;
        }
        this.homeSetInterval = setInterval(() => {
          this.update(this.chain);
        }, 10000)
      },

      // 更新账户资产列表、交易列表
      async update(chain) {
        //this.assetsLoading = true;
        this.txList = [];
        this.pageNumber = 1;
        this.txTotal = 0;
        this.address = this.currentAccount[chain];
        const address = this.currentAccount[chain];
        const res = await this.$request({
          url: "/wallet/address/assets",
          data: {chain, address}
        });
        if (res.code === 1000) {
          let total = 0;
          res.data.map(v => {
            total = Plus(total, v.usdPrice).toFixed();
            v.total = divisionDecimals(v.total, v.decimals);
            v.amount = v.total
          });

          res.data.map(v => {
            v.percent = parseFloat(Times(Division(v.usdPrice, total), 100).toFixed(2)).toString() + '%'
          });
          //console.log(res.data);
          this.list = res.data;
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
          query: {...newQuery}
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
        const {chainId: assetChainId, assetId} = config[network][this.chain];
        const query = {
          address: this.address,
          chain: this.chain,
          assetChainId,
          assetId
        };
        this.$router.push({path, query});
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
    .app-modal {
      .inner-content {
        min-height: 100px;
      }
      .sites-wrap {
        .site-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 44px;
          border-bottom: 1px solid #e9ebf3;
          .left {
            display: flex;
            align-items: center;
          }
        }
        .circle {
          display: inline-block;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #53b8a9;
          margin-right: 5px;
        }
        .site-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          width: 180px;
        }
        .operate {
          font-size: 12px;
          color: #53b8a9;
          cursor: pointer;
        }
        .connect-current {
          font-size: 12px;
          height: 44px;
          line-height: 44px;
          color: #53b8a9;
          text-align: center;
          cursor: pointer;
        }
      }
    }
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

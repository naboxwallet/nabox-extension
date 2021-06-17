<template>
  <div class="home">
    <Header
            :network="$store.state.network"
            :accountName="chainAccount.name"
            :proportionData="proportionData"
            @show-app-modal="showAppModal"
            @show-asset-modal="showAssetModal"
            @changeNetwork="changeNetwork">
    </Header>

    <!--<Overview
            @show-app-modal="showAppModal"
            @show-asset-modal="showAssetModal"
            :accountName="chainAccount.name"
            :balance="chainAccount['balance_' + $store.state.network]"
    />-->

    <Assets
            @show-modal="showQrcode"
            :chain="chain"
            :accountInfo="accountInfo"
            :chainList="chainList"
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
    <Modal class="overview-modal" :visiable.sync="overviewModal" :title="$t('home.home12')">
      <div class="content-head">
        <span>{{ $t("public.chain") }}</span>
        <span>{{ $t("public.amount") }}</span>
        <span>{{ $t("public.percent") }}</span>
      </div>
      <div class="info">
        <div class="info-item" v-for="(item, index) in proportionData.list" :key="index">
          <span>{{ item.chain }}</span>
          <span>${{ item.price }}</span>
          <span>{{ item.proportion !=='NaN' ? item.proportion : '--'  }} {{ item.proportion !=='NaN' ? '%' : ''  }}</span>
        </div>
      </div>
    </Modal>

    <!-- 二维码弹窗 -->
    <Modal :visiable.sync="qrcodeModal" class="qr-code-modal" :title="chainAccount.name">
      <div id="qrcode" class="qrcode"></div>
      <p class="address">{{ address }}</p>
    </Modal>
  </div>
</template>

<script>
  import Header from "@/components/Header";
  import Assets from "@/views/home/Assets";
  import Modal from "@/components/Modal";
  import QRCode from "qrcodejs2";
  import {divisionDecimals, getStorage, Plus, Division, Times, tofix} from "@/utils/util";
  import ExtensionPlatform from "@/utils/extension";
  import axios from "axios";
  import {config} from "@/config.js";

  export default {
    data() {
      this.pageNumber = 1;
      this.pageSize = 10;
      return {
        // network: "",
        currentAccount: [],
        address: "",
        appModal: false,
        allowSites: [], //已连接应用, 每次打开弹窗会重新计算
        currentTab: {}, //当前网站tab信息
        showManualConnect: false,
        overviewModal: false,
        qrcodeModal: false,
        chain: "",
        accountInfo: {},
        txList: [],
        txTotal: 0,
        assetsLoading: true,
        txLoading: true,
        proportionData: {total: 0, list: []},//资产总览data
        homeSetInterval: null,//定时器
        chainList: {},//链列表
      };
    },

    watch: {
      "$store.state.network": {
        immediate: true,
        handler(val) {
          //console.log(val);
          if (!val) return;
          if (val === 'main' && this.chain === 'OKExChain') { //todo 临时的 主网上ok取消
            this.chain = 'Ethereum'
          }
          this.changeAccount();
        }
      },
      "$store.getters.currentAccount": {
        handler(val, old) {
          if (!val || val.id === old.id) return;
          this.changeAccount();
        }
      },
      "appModal": {
        handler(val) {
          if (val) {
            this.allowSites = [];
          }
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
      Header, Assets, Modal,//Overview
    },

    created() {
      this.getLockInfo();
      /*const nabox = await getStorage("nabox", {});
      console.log(nabox);*/
    },

    async mounted() {
      const nabox = await getStorage("nabox", {});
      this.chain = nabox.chain || "Ethereum";

      this.homeSetInterval = setInterval(() => {
        //this.update(this.chain); http://192.168.1.132:8083/nabox-api/api/sync/info
        this.syncInfo();
      }, 10000);
      
      setTimeout(async () => {
        let accountList = this.$store.state.accountList;
        for (let item of accountList) {
          let resData = await this.getAccountOverview(item.pub);
          if (resData.success) {
            if (this.$store.state.network === 'main') {
              item.balance_main = resData.data.total;
            } else if (this.$store.state.network === 'beta') {
              item.balance_beta = resData.data.total;
            }
          }
        }
        //console.log(accountList);
        this.$store.commit("setAccount", accountList);
      }, 1000);
    },

    destroyed() {
      clearInterval(this.homeSetInterval);
    },

    methods: {

      //获取账户是否锁定
      async getLockInfo() {
        const nabox = await getStorage("nabox", {});
        //console.log(nabox);
        if (nabox.lock) {
          this.$router.push({
            path: "/lock",
          });
        }
      },

      //选择网络
      async changeNetwork(network) {
        const accounts = this.$store.getters.currentAccount;
        const currentAccount = accounts[network];
        this.currentAccount = currentAccount;
        await this.$store.dispatch("setNetwork", network);

        const config = JSON.parse(localStorage.getItem("config"));
        const nabox = await getStorage("nabox", {});
        const chain = nabox.chain;
        const chainId = config[network][chain].nativeId
        nabox.chainId = "0x" +chainId.toString(16)
        ExtensionPlatform.set({nabox})
        //this.update(this.chain);
      },

      //显示应用连接
      async showAppModal() {
        this.appModal = true;
        const nabox = await getStorage("nabox", {});
        //console.log(nabox);
        if (nabox.allowSites) {
          for (let items of nabox.allowSites) {
            for (let item of items.approvedList) {
              if (item.accountId === this.$store.getters.currentAccount.id) {
                this.allowSites.push({
                  approvedInfo: item,
                  origin: items.origin
                })
              }
            }
          }
        }

        //this.allowSites = nabox.allowSites || [];
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
          //console.log(tabs, 12345);
          if (tabs.length && tabs[0].url) {
            const url = tabs[0].url;
            const origin = url.split("://")[0] + "://" + url.split("://")[1].split("/")[0];
            this.currentTab = {domain: origin, icon: tabs[0].favIconUrl};
            const exist = this.allowSites.filter(v => v.origin === origin)[0];
            this.showManualConnect = exist ? false : true;
          }
        });
      },

      /**
       * @disc: 获取账户总览数据
       * @params: pubKey 公钥
       * @date: 2021-01-28 15:46
       * @author: Wave
       */
      async getAccountOverview(pubKey) {
        try {
          let newData = {url: "/wallet/chain/price", data: {"pubKey": pubKey}};
          //console.log(newData);
          const res = await this.$request(newData);
          //console.log(res, "getAccountOverview");
          if (res.code === 1000) {
            let total = 0;
            res.data.map(v => {
              total = Plus(total, v.price).toString();
            });
            res.data.map(v => {
              v.proportion = Times(Division(v.price, total).toFixed(4), 100).toString();
              v.price = parseFloat(tofix(v.price, 2, -1));
            });
            return {success: true, data: {total: parseFloat(tofix(total, 2, -1)), list: res.data}};
          } else {
            return {success: false, data: res};
          }
        } catch (err) {
          return {success: false, data: err};
        }
      },

      //显示资产总览
      async showAssetModal() {
        //this.update(this.chain);
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
        //console.log(site);
        const nabox = await getStorage("nabox", {});
        /* const index = nabox.allowSites.findIndex(v => v.origin === site);
        if (index > -1) {
          nabox.allowSites.splice(index, 1)
          ExtensionPlatform.set({nabox});
        }
        this.allowSites = [];
        this.appModal = false; */

        for (let item of nabox.allowSites) {
          //console.log(item);
          if (item.origin === site) {
            // let newList = item.approvedList.filter(obj => obj.accountId !== this.$store.getters.currentAccount.id);
            // item.approvedList = [];
            item.approvedList = item.approvedList.filter(obj => obj.accountId !== this.$store.getters.currentAccount.id);
          }
        }
        // let newllowSites = nabox.allowSites.filter(obj => obj.approvedList.length !== 0);
        // nabox.allowSites = newllowSites;
        //console.log(nabox);
        ExtensionPlatform.set({nabox});
        this.allowSites = [];
        this.appModal = false;
      },

      //显示二维码
      showQrcode() {
        this.qrcodeModal = true;
        if (document.getElementById("qrcode")) {
          document.getElementById("qrcode").innerHTML = "";
        }
        this.$nextTick(() => {
          this.generateCode();
        });
      },

      //华二维码
      generateCode() {
        let qrcode = new QRCode("qrcode", {
          text: this.address,
          width: 130,
          height: 130,
          colorDark: "#000000",
          colorLight: "#ffffff"
        });
        console.log(qrcode)
      },

      // 切换账户
      async changeAccount() {
        const network = this.$store.state.network;
        const accounts = this.$store.getters.currentAccount;
        const currentAccount = accounts[network];
        //console.log(network, accounts, currentAccount);
        this.currentAccount = currentAccount;
        this.update(this.chain);
      },

      // 切换链网络
      async changeSymbol(chain) {
        this.assetsLoading = true;
        const config = JSON.parse(localStorage.getItem("config"));
        const network = this.$store.state.network;
        const nabox = await getStorage("nabox", {});
        nabox.chain = chain;
        const chainId = config[network][chain].nativeId
        nabox.chainId = "0x" +chainId.toString(16)
        ExtensionPlatform.set({nabox})
        // sessionStorage.setItem("chain", chain);
        this.chain = chain;
        this.update(chain);

        /* if (this.homeSetInterval) {
          this.homeSetInterval = null;
        }
        this.homeSetInterval = setInterval(() => {
          //this.update(this.chain);
        }, 10000) */
      },

      // 更新账户资产列表
      async update(chain) {
        //this.assetsLoading = true;
        if (!chain) {
          const nabox = await getStorage("nabox", {});
          chain = nabox.chain || "Ethereum";
        }
        this.txList = [];
        this.pageNumber = 1;
        this.txTotal = 0;
        this.address = this.currentAccount[chain];
        const address = this.currentAccount[chain];
        const res = await this.$request({
          url: "/wallet/address/assets",
          data: {chain, address}
        });
        //console.log(res, "update");
        if (res.code === 1000) {
          let total = 0;
          res.data.map(v => {
            total = parseFloat(tofix(Plus(total, v.usdPrice), 2, -1));
            v.total = parseFloat(tofix(divisionDecimals(v.total, v.decimals), 8, -1));
            v.amount = v.total;
            v.usdPrice = parseFloat(tofix(v.usdPrice, 2, -1));
            v.percent = parseFloat(Times(Division(v.usdPrice, total), 100).toFixed(2)).toString() + '%';
          });
          this.list = res.data;
          this.accountInfo = {address, total, assetsList: res.data};
          //console.log(this.accountInfo, "accountInfo");
        } else {
          this.$message({message: res.msg, type: "warning", duration: 3000});
        }
        this.assetsLoading = false;
        let resData = await this.getAccountOverview(this.$store.getters.currentAccount.pub);
        //console.log(resData);
        if (resData.success) {
          this.proportionData.total = resData.data.total;
          this.proportionData.list = resData.data.list;
        } else {
          this.proportionData.total = 0;
          this.proportionData.list = [];
        }
        this.getTxList();
      },

      //交易列表
      async getTxList() {
        //this.txLoading = true;
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
        //console.log(res);
        if (res.code === 1000) {
          res.data.records.map(v => {
            //v.createTime = formatTime(v.createTime * 1000);
            v.amount = divisionDecimals(v.amount, v.decimals);
            v.chainInfo = this.chain
          });
          //this.txList = this.txList.concat(...res.data.records);
          this.txList = res.data.records;
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
        const config = JSON.parse(localStorage.getItem("config"));
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
        sessionStorage.setItem("visibleAssets", JSON.stringify(this.accountInfo.assetsList));
        this.$router.push({
          path: "/add-asset",
          query: {
            address: this.address,
            chain: this.chain
          }
        });
      },

      /**
       * @disc: 获取链信息
       * @params:
       * @date: 2021-04-26 15:04
       * @author: Wave
       */
      async syncInfo() {
        let newNetwork = (await ExtensionPlatform.get("network")).network || "main";
        let baseUrl = config[newNetwork].BASE_URL;
        let url = baseUrl + '/api/sync/info';
        //console.log(url);
        let resData = await axios.get(url);
        //console.log(resData);
        if (resData.data.code === 1000) {
          //console.log(resData.data.data);
          this.chainList = resData.data.data
        }
      }

    }
  };</script>

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

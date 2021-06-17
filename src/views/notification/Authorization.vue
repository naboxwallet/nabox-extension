<template>
  <div class="authorization">
    <div class="from-wrap">
      <div class="from-logo">
        <img v-if="notification.data && notification.data.icon" :src="notification.data.icon"/>
        <i v-else>C</i>
      </div>
      <p class="from-origin">{{ notification.domain }}</p>
    </div>
    <div class="select-account">
      <h3 class="tc">{{ $t("authorization.authorization1") }}</h3>
    </div>
    <h2 class="plugin-chain-info">{{ $t("authorization.authorization6") + chainInfo.chain + " - " +chainInfo.network }}</h2>
    <div class="network-list">
      <h3>{{ $t("authorization.authorization5") }}</h3>
      <!--<el-radio-group v-model="network">
        <el-radio :key="item" :label="item" v-for="item in networkList">
          {{ item }}
        </el-radio>
      </el-radio-group>-->
      <div class="account-list">
        <el-checkbox-group v-model="authorizationList">
          <el-checkbox v-for="item in accountList" :key="item.id" :label="item">
            <template>
                <span>{{item.name}}</span>
                (...{{ (item[chainInfo.network][chainInfo.chain]).slice(-5) }})
                <label>${{ item["balance_" + chainInfo.network] }}</label>
            </template>
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <!-- <div style="height: 30px"></div> -->
    </div>
    <div class="btn-wrap">
      <el-button @click="reject">{{ $t("public.cancel") }}</el-button>
      <el-button type="primary" @click="connect">
        {{ $t("authorization.authorization4") }}
      </el-button>
    </div>
  </div>
</template>

<script>
  import {Plus, Division, Times, tofix, superLong} from "@/utils/util";
  import notifacationMixin from "./nofifacationMixin"
  import ExtensionPlatform from "@/utils/extension";

  export default {
    data() {
      return {
        authorizationList: [],//授权列表
        accountList: [],
        chainInfo: {}
      };
    },
    mixins: [notifacationMixin],

    components: {},

    watch: {},

    computed: {},

    created() {
    },

    async mounted() {
      const localStore = await ExtensionPlatform.get();
      const nabox = localStore.nabox || {}; 
      const { chain, network } = nabox;
      this.chainInfo = {
        chain,
        network
      }
      // const currentAccount = nabox.currentAccount;
      // let newList = this.$store.state.accountList.filter(obj => obj.id === k.accountId);
      // console.log(nabox.currentAccount)
      // this.authorizationList = [nabox.currentAccount]

      this.accountList = localStore.accountList || [];

      for (let item of this.accountList) {
        let resData = await this.getAccountOverview(item.pub);
        if (resData.success) {
          if (network === 'main') {
            item.balance_main = resData.data.total;
          } else if (network === 'beta') {
            item.balance_beta = resData.data.total;
          }
        }
      }
    },

    methods: {
      superLong(str, len = 6) {
        return superLong(str, len)
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
          const res = await this.$request(newData);
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

      //确认授权
      async connect() {
        if (this.authorizationList.length === 0) {
          this.$message({message: this.$t('tips.tip18'), type: 'warning', duration: '2000'});
          return;
        }
        const approvedList = [];
        const { chain, network } = this.chainInfo;
        for (let item of this.authorizationList) {
          const address = item[network][chain];
          /* let info = {
            chain: chain,
            network: network,
            address: address,
            accountId: item.id,
            nativeId: "0x" + nativeId.toString(16)
          }; */
          const info = {
            address,
            accountId: item.id
          }
          approvedList.push(info)
        }

        this.respond(approvedList)

        /* const defaultAccount = await getSelectedAccount();
        const defaultAddress = defaultAccount[network][chain];
        const accountInfo = approvedList.filter(item => item.address === defaultAddress)[0] || approvedList[0];
        const nabox = await getStorage("nabox", {});
        const chainId = nabox.chainId
        const allowSites = nabox.allowSites || [];
        allowSites.push({
            origin: this.notification.domain,
            approvedList: approvedList,
        });
        nabox.allowSites = allowSites;
        ExtensionPlatform.set({nabox});
        this.respond({ address: accountInfo.address, chainId }); */
        /* 
        const network = nabox.network;
          const defaultAccount = await getSelectedAccount();
          const chain = nabox.chain || "Ethereum";
          const chainId = nabox.chainId || "0x1";
          const defaultAddress = defaultAccount[network][chain];
          // 如果授权的账户中包含当前账户，则返回当前账户
          const accountInfo = approvedList.filter(item => item.address === defaultAddress)[0] || approvedList[0];
          sendResponse({ type, status: true, payload: { address: accountInfo.address, chainId } });
          
          allowSites.push({
            origin: domain,
            approvedList: approvedList,
          });
          nabox.allowSites = allowSites;
          ExtensionPlatform.set({nabox});
        */
        // this.respond(resData);
      }
    }
  };
</script>
<style lang="less">
  .authorization {
    padding: 30px 0;
    height: 100%;
    overflow: auto;
    .from-wrap {
      display: flex;
      align-items: center;
      flex-direction: column;
      .from-origin {
        font-size: 14px;
        color: #6a737d;
        margin: 15px 0;
        padding: 0 80px;
        text-align: center;
      }
    }
    .from-logo {
      border-radius: 50%;
      border: 1px solid #f2f3f4;
      background: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 80px;
      height: 80px;
      img {
        width: 48px;
        height: 48px;
      }
      i {
        color: #000;
        font-style: normal;
      }
    }
    .select-account h3 {
      // margin-bottom: 10px;
      font-size: 14px;
    }
    .network-list {
      margin-left: 30px;
      h3 {
        margin-bottom: 5px;
        font-size: 14px;
      }
      .el-radio-group {
        .el-radio {
          display: block;
          line-height: 1.8;
        }
      }

      .account-list {
        max-height: 200px;
        overflow: auto;
        .el-checkbox {
          width: 90%;
          margin: 20px 0 0;
          height: 36px;
          border-bottom: 1px solid #E9EBF3;
          .el-checkbox__label {
            line-height: 11px;
            span {
              font-size: 15px;
              color: #3A3C44;
              display: block;
              float: left;
              margin-right: 5px;
            }
            label {
              font-size: 15px;
              color: #AAB2C9;
              // display: block;
              // float: left;
              margin: 0 0 0 1rem;
            }
            p {
              font-size: 14px;
            }
          }
        }
      }
    }
    .plugin-chain-info {
      font-weight: 600;
      line-height: 18px;
      font-size: 16px;
      text-align: center;
      padding: 10px;
    }
    .btn-wrap {
      text-align: center;
      margin-top: 70px;
      .el-button {
        width: 130px;
        height: 44px;
        border-color: #49C7B5;
        border-radius: 22px;
        font-size: 12px;
        padding: 12px 0;
        & + .el-button {
          margin-left: 20px;
        }
      }
      .el-button--default {
        background: #fff;
        color: #49C7B5;
      }
      .el-button--primary {
        background: #49C7B5;
        color: #F9FAFC;
      }
    }
  }
</style>

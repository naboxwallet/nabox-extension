<template>
  <div class="new-address" v-loading="loading">
    <common-head>
      {{ $t("public.newAddress") }}
    </common-head>
    <div class="content">
      <el-tabs v-model="activeName">
        <el-tab-pane :label="$t('public.create')" name="create">
          <label class="label">{{ $t("login.login10") }}</label>
          <el-input v-model="accoutName">
          </el-input>
          <el-button type="primary" @click="submitCreate('')">
            {{ $t("public.create") }}
          </el-button>
        </el-tab-pane>
        <el-tab-pane :label="$t('public.import')" name="import">
          <label class="label">{{ $t("login.login8") }}</label>
          <el-input type="textarea" v-model.trim="pri" @change="changeKey">
          </el-input>
          <div class="tip" v-show="tips">
            {{ tips }}
          </div>
          <el-button type="primary" @click="submitCreate('import')">
            {{ $t("public.import") }}
          </el-button>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script>
  import CommonHead from "@/components/CommonHead";
  import ExtensionPlatform from "@/utils/extension";
  import {createAccount} from "@/utils/api";
  import {genID, decryptPassword} from "@/utils/util";

  export default {
    data() {
      return {
        activeName: this.$route.query.type || "create",
        accoutName: "",
        pri: "",
        tips: '',//私钥导入提示信息
        loading: false
      };
    },

    components: {
      CommonHead
    },

    computed: {},

    created() {
    },

    async mounted() {
      const passwordInfo = await ExtensionPlatform.get("password");
      this.password = decryptPassword(passwordInfo.password);
      const accountList = (await ExtensionPlatform.get("accountList")).accountList;
      this.accountList = accountList;
      this.accoutName = "Account" + (accountList.length + 1);
    },

    methods: {

      //验证私钥
      changeKey() {
        if (!this.pri) {
          this.tips = this.$t("login.login8");
        } else if (this.pri.length < 60 || this.pri.length > 66) {
          this.tips = this.$t("login.login9");
        } else {
          this.tips = "";
        }
      },

      async submitCreate(isImport = false) {
        //console.log("isImport:", isImport);
        this.loading = true;
        let addressInfo = {};
        if (isImport) {
          await this.changeKey();
          if (this.tips) {
            this.loading = false;
            return;
          }
          addressInfo = createAccount(this.password, this.pri);
        } else {
          addressInfo = createAccount(this.password);
        }
        const {aesPri, pub, beta, main} = addressInfo;
        if (!aesPri || !pub || !beta || !main || !beta.NERVE || !beta.Ethereum) {
          this.$message({message: this.$t("public.createError"), type: "warning", duration: 3000});
          this.loading = false;
          return false;
        } else {
          const accountList = [...this.accountList];
          const exit = await this.checkNewAccount(aesPri);
          const syncRes = await this.syncAccount(pub, addressInfo);
          //console.log(syncRes);
          if (!syncRes) {
            this.$message({message: "网络异常，请稍后再试", type: "warning", duration: 3000},);
            this.loading = false;
            return;
          }
          if (!exit) {
            const id = genID();
            accountList.map(account => {
              account.selection = false;
            });
            const account = {
              id: id,
              name: this.accoutName,
              selection: true,
              balance_beta: 0,
              balance_main: 0,
              aesPri,
              pub,
              beta,
              main
            };
            accountList.push(account);
          } else {
            accountList.map(account => {
              account.selection = false;
              if (account.aesPri === aesPri) {
                account.selection = true;
              }
            });
          }
          await this.$store.dispatch("setAccount", accountList);
          this.loading = false;
          //console.log(this.activeName);
          if (this.activeName === 'create') {
            this.$router.push("/account-manage");
          } else {
            this.$router.push("/");
          }
        }
      },

      async checkNewAccount(aesPri) {
        const accountList = [...this.accountList];
        return accountList.filter(v => v.aesPri === aesPri).length;
      },

      async syncAccount(pub, accounts) {
        let accountsList = accounts[this.$store.state.network];
        const addressList = Object.keys(accountsList).map(v => {
          return {chain: v, address: accountsList[v]};
        });

        let config = JSON.parse(localStorage.getItem('config'));
        let assetsList = Object.keys(config.main);
        if (!assetsList.includes('OKExChain') && this.$store.state.network === 'main') { //todo ok主网上线去掉
          addressList.splice(addressList.findIndex(item => item.chain === 'OKExChain'), 1);
        }

        const res = await this.$request({
          url: "/wallet/sync",
          data: {pubKey: pub, addressList},
          network: this.$store.state.network
        });
        //console.log(res);
        if (res.code === 1000) {
          let network = this.$store.state.network === 'main' ? 'beta' : 'main';
          let accountsListTwo = accounts[network];
          const addressListTwo = Object.keys(accountsListTwo).map(v => {
            return {chain: v, address: accountsListTwo[v]};
          });

          if (!assetsList.includes('OKExChain') && this.$store.state.network === 'main') { //todo ok主网上线去掉
            addressListTwo.splice(addressListTwo.findIndex(item => item.chain === 'OKExChain'), 1);
          }

          await this.$request({
            url: "/wallet/sync",
            data: {pubKey: pub, addressList: addressListTwo},
            network: network
          });
          return true;
        }
        return false;
      }
    }
  };
</script>
<style lang="less">
  .new-address {
    .content {
      margin-top: 10px;
      .el-tabs__nav-wrap,
      .el-tabs__content {
        padding: 0 25px;
      }
      .el-button {
        margin-top: 20px;
        width: 100%;
        // text-align: center;
      }
      .label {
        font-size: 12px;
        color: #a5abb2;
        line-height: 20px;
        margin-bottom: 5px;
      }
      .tip {
        color: #f56c6c;
        font-size: 12px;
        line-height: 1;
        padding-top: 5px;
      }
      .el-tabs {
        .el-tabs__item {
          padding: 0 10px;
          &:nth-child(2) {
            padding-left: 0;
          }
          &:last-child {
            padding-right: 0;
          }
        }
      }
    }
  }
</style>

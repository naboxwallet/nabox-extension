<template>
  <div class="login-page" v-loading="loading">
    <img src="../../assets/img/logo.svg" alt=""/>
    <el-form :model="newAddressForm" status-icon :rules="newAddressRules" ref="newAddress" label-position="top">
      <el-form-item :label="$t('login.login8')" prop="pri" v-if="importAddress">
        <el-input type="textarea" v-model.trim="newAddressForm.pri">
        </el-input>
      </el-form-item>
      <el-form-item :label="$t('public.password')" prop="pass">
        <el-input type="password" v-model="newAddressForm.pass">
        </el-input>
      </el-form-item>
      <el-form-item :label="$t('public.checkPassword')" prop="checkPass">
        <el-input type="password" v-model="newAddressForm.checkPass">
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm('newAddress')">
          {{ importAddress ? $t("public.import") : $t("public.setPassword") }}
        </el-button>
      </el-form-item>
    </el-form>
    <div class="import-tip" v-if="!importAddress">
      {{ $t("login.login5") }}
      <el-button type="text" @click="changeLogin('import')">
        {{ $t("login.login6") }}
      </el-button>
    </div>
    <div class="import-tip" v-else>
      <el-button type="text" @click="changeLogin()">
        {{ $t("login.login7") }}
      </el-button>
    </div>
  </div>
</template>

<script>
  import ExtensionPlatform from "@/utils/extension";
  import {createAccount} from "@/utils/api";
  import {genID, encryptPassword} from "@/utils/util";

  export default {
    data() {
      const validatePri = (rule, value, callback) => {
        if (!this.importAddress) {
          callback();
        } else if (value === "") {
          callback(new Error(this.$t("login.login8")));
        } else if (value.length < 60 || value.length > 66) {
          callback(new Error(this.$t("login.login9")));
        } else {
          callback();
        }
      };
      const validatePass = (rule, value, callback) => {
        //const reg = /(?!^\d+$)(?!^[a-zA-Z]+$)^[0-9a-zA-Z]{8,20}$/;
        const reg = /(?!.*\s)(?!^[\u4E00-\u9FA5]+$)(?!^[a-zA-Z]+$)(?!^[\d]+$)(?!^[^\u4E00-\u9FA5a-zA-Z\d]+$)^.{8,20}$/;
        if (value === "") {
          callback(new Error(this.$t("login.login1")));
        } else if (!reg.exec(value)) {
          callback(new Error(this.$t("login.login2")));
        } else {
          callback();
        }
      };
      const validatePass2 = (rule, value, callback) => {
        //console.log(value, this.newAddressForm.pass);
        if (value === "") {
          callback(new Error(this.$t("login.login3")));
        } else if (value !== this.newAddressForm.pass) {
          callback(new Error(this.$t("login.login4")));
        } else {
          callback();
        }
      };
      return {
        loading: false,
        newAddressForm: {
          pri: "",
          pass: "",
          checkPass: ""
        },
        newAddressRules: {
          pri: [{validator: validatePri, trigger: ["blur"]}],
          pass: [{validator: validatePass, trigger: ["blur"]}],
          checkPass: [{validator: validatePass2, trigger: ["blur"]}],
        },
        importAddress: false //导入私钥
      };
    },

    components: {},

    watch: {},

    computed: {},

    created() {
    },

    mounted() {
    },

    methods: {

      changeLogin(type) {
        this.newAddressForm.pass = this.newAddressForm.checkPass = this.newAddressForm.pri = "";
        if (type) {
          this.importAddress = true;
        } else {
          this.importAddress = false;
        }
      },

      submitForm(formName) {
        this.$refs[formName].validate(async valid => {
          if (valid) {
            this.loading = true;
            const {pass: password, pri} = this.newAddressForm;
            let addressInfo = {};
            if (this.importAddress) {
              addressInfo = createAccount(password, pri);
            } else {
              addressInfo = createAccount(password);
            }
            //console.log(addressInfo);
            const {aesPri, pub, beta, main} = addressInfo;
            if (!aesPri || !pub || !beta || !main || !beta.NERVE || !beta.Ethereum) {
              this.$message({message: this.$t("public.createError"), type: "warning", duration: 3000});
              this.loading = false;
              return false;
            } else {
              const id = genID();
              const syncRes = await this.syncAccount(pub, addressInfo);
              if (syncRes) {
                const account = {
                  id: id,
                  name: "Account1",
                  selection: true,
                  balance_beta: 0,
                  balance_main: 0,
                  aesPri,
                  pub,
                  beta,
                  main
                };
                const encryptedPassword = encryptPassword(password);
                ExtensionPlatform.set({password: encryptedPassword});
                await this.$store.dispatch("setAccount", [account]);
                this.loading = false;
                this.$router.push("/");
              } else {
                this.$message({type: "warning", message: "网络异常，请稍后再试"});
                this.loading = false;
              }
            }
          } else {
            return false;
          }
        });
      },

      async syncAccount(pub, accounts) {
        let accountsList = accounts[this.$store.state.network];
        const addressList = Object.keys(accountsList).map(v => {
          return {chain: v, address: accountsList[v]};
        });
        let config = JSON.parse(localStorage.getItem('config'));
        let assetsList = Object.keys(config.main);
        if (!assetsList.includes('OKExChain')) { //todo ok主网上线去掉
          addressList.splice(addressList.findIndex(item => item.chain === 'OKExChain'), 1);
        }
        const res = await this.$request({url: "/wallet/sync", data: {pubKey: pub, addressList}});
        if (res.code === 1000) {
          let network = this.$store.state.network === 'main' ? 'beta' : 'main';
          let accountsListTwo = accounts[network];
          const addressListTwo = Object.keys(accountsListTwo).map(v => {
            return {chain: v, address: accountsListTwo[v]};
          });
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
  .login-page {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 100px 25px 0;
    img {
      width: 130px;
    }
    .el-form,
    .el-button--primary {
      width: 100%;
    }
    .el-button--primary {
      margin-top: 20px;
    }
    .import-tip {
      font-size: 12px;
      width: 100%;
    }
  }
</style>

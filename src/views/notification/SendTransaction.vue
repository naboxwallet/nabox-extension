<template>
  <div class="send-transaction transfer-page" v-loading="loading">
    <transition name="fade-transform" mode="out-in">
      <div class="content" v-show="!showConfirm">
        <el-form label-position="top" :model="transferModal" :rules="transferRules" ref="transferForm">
          <el-form-item :label="'From(' + chain + ')'">
            <el-input disabled :value="superLong(transferModal.from)">
            </el-input>
            <p class="address-validate-error" v-if="addressError || !isAccreditAddress">
              {{ addressError ? $t("notification.notification5") : $t('notification.notification7') }}
            </p>
          </el-form-item>
          <el-form-item :label="'To(' + transferModal.toChain + ')'" prop="to">
            <el-input disabled :value="superLong(transferModal.to)">
            </el-input>
          </el-form-item>
          <el-form-item :label="$t('public.symbol')">
            <el-input disabled :value="transferModal.symbol">
            </el-input>
          </el-form-item>
          <span class="available">
            {{ $t("public.available") + ": " }}{{ chooseAsset.balance }}
          </span>
          <el-form-item :label="$t('public.amount')" prop="amount">
            <el-input v-model="transferModal.amount">
            </el-input>
          </el-form-item>
          <el-form-item :label="$t('public.remark')" v-if="chain === 'NULS' || chain === 'NERVE'">
            <el-input type="textarea" v-model="transferModal.remarks" maxlength="200" show-word-limit>
            </el-input>
          </el-form-item>
          <div class="fee">
            <p class="fee-label">{{ $t("public.fee") }}: </p>
            <span v-if="!feeLoading">{{ fee }}{{ feeSymbol }}</span>
            <img v-else src="../../assets/img/loading.svg"/>
            <el-checkbox v-if="chain !== 'NULS' && chain !== 'NERVE'" v-model="speedUpFee" @change="changeSpeedUpFee">
              {{ $t("transfer.transfer14") }}
            </el-checkbox>
          </div>
          <div class="btn-wrap">
            <el-button @click="reject">{{ $t("public.cancel") }}</el-button>
            <el-button type="primary" @click="checkForm('transferForm')" :disabled="feeLoading || addressError">
              {{ $t("public.next") }}
            </el-button>
          </div>
        </el-form>
      </div>
    </transition>
    <transfer-confirm :data="confirmData" :visiable.sync="showConfirm" @confirm="submit">
    </transfer-confirm>
  </div>
</template>

<script>
  import TransferConfirm from "@/components/TransferConfirm";
  import NotificationService from "@/utils/NotificationService";
  import {divisionDecimals, superLong, chainToSymbol, timesDecimals, Plus, Times, getStorage} from "@/utils/util";
  import {NTransfer, ETransfer, validateAddress} from "@/utils/api";
  import {getContractCallData} from "@/utils/nulsContractValidate";
  import nuls from "nuls-sdk-js";
  import notifacationMixin from "./nofifacationMixin"

  export default {
    data() {
      const validateTo = (rule, value, callback) => {
        //console.log(this.changeAssetInfo);
        if (value === "") {
          callback(new Error(this.$t("transfer.transfer1")));
        } else if (this.chain !== "NULS" && this.chain !== "NERVE") {
          const correct = validateAddress(value);
          if (correct) {
            callback();
          } else {
            callback(new Error(this.$t("transfer.transfer1")));
          }
        } else if (this.chain === "NERVE" || this.chain === "NULS") {
          const from = nuls.verifyAddress(this.transferModal.from);
          let to = {};
          try {
            to = nuls.verifyAddress(value);
          } catch (e) {
            // console.error(e)
          }
          if (from.chainId !== to.chainId) {
            callback(new Error(this.$t("transfer.transfer1")));
          } else {
            callback();
          }
        } else {
          callback();
        }
      };
      const validateAmount = (rule, value, callback) => {
        const decimals = this.chooseAsset.decimals || 8;
        const patrn = new RegExp("^([1-9][\\d]{0,20}|0)(\\.[\\d]{0," + decimals + "})?$");
        if (value === "") {
          callback(new Error(this.$t("transfer.transfer2")));
        } else if (!patrn.exec(value)) {
          callback(new Error(this.$t("transfer.transfer3") + ": " + decimals));
        } else if (value - this.chooseAsset.balance > 0) {
          callback(new Error(this.$t("transfer.transfer4") + ": " + this.chooseAsset.balance));
        } else {
          if (this.chain === "NULS") this.validateParameter();
          callback();
        }
      };

      this.network = "";
      this.MAIN_INFO = {};
      this.getAssetFailCount = 0;
      return {
        loading: true,
        chain: "",
        // notification: {},
        transferModal: {
          from: "",
          to: "",
          symbol: "",
          amount: "",
          remarks: "",
          data: '',
          gas: 1,
          price: 25,
        },
        transferRules: {
          to: [{validator: validateTo, trigger: ["blur"]}],
          amount: [{validator: validateAmount, trigger: ["blur"]}],
        },
        chooseAsset: {},
        errorTip: "",
        fee: "",
        feeSymbol: "",
        speedUpFee: false,
        showSpeedUp: false,
        feeLoading: false,
        showConfirm: false,
        isAccreditAddress: true
      };
    },
    mixins: [notifacationMixin],

    components: {
      TransferConfirm
    },

    watch: {},

    computed: {
      confirmData() {
        const fee = this.fee + this.feeSymbol;
        return {
          from: superLong(this.transferModal.from, 12),
          to: superLong(this.transferModal.to, 12),
          amount: this.transferModal.amount,
          assetSymbol: this.transferModal.symbol,
          fee
        };
      }
    },

    created() {

    },

    mounted() {

      if (JSON.parse(localStorage.getItem("config"))) {
        this.init();
      } else {
        setTimeout(async () => {
          await this.init();
        }, 1000)
      }
    },

    methods: {

      superLong(str, len = 12) {
        return superLong(str, len);
      },

      async init() {
        const txData = this.notification.data;
        console.log(txData, "txData222");
        this.transferModal = Object.assign(this.transferModal, txData);
        this.connectedInfo = await this.getConnectInfo();
        await this.validateAddress(txData.from)
        const {chain, network} = this.connectedInfo;
        this.network = network;
        this.chain = chain;
        // const accounts = this.$store.getters.currentAccount;
        this.transferModal.from = txData.from; //accounts[network][chain];
        this.transferModal.toChain = chain;
        this.feeSymbol = chainToSymbol[chain];
        const config = JSON.parse(localStorage.getItem("config"));
        // console.log(this.network, this.chain, config);
        this.MAIN_INFO = config[network][chain];
        this.isAccreditAddress = await this.checkCurrentAccount(this.notification.data.address)
        // console.log(this.MAIN_INFO);
        if (this.chain !== "NULS" && this.chain !== "NERVE") {
          // TODO
          this.respond({success: false, data: "Not support yet"});
          return;
          //
          // this.initEtransfer();
        } else {
          this.initNtransfer();
        }
      },

      async initEtransfer() {
        // console.log(this.transferModal, 6666);
        const {to, data, value} = this.transferModal.params[0];
        // console.log(to, data, value, this.chain, this.network, 7777);
        this.eTransfer = new ETransfer({
          chain: this.chain,
          network: this.network
        });
        // console.log(this.eTransfer);
        const decodeData = this.eTransfer.decodeData(data);
        // console.log(decodeData, 55);
        if (decodeData) {
          // eth bsc token转账
          const contractAddress = to; 
          await this.getTransferAsset({contractAddress}, decodeData.amount);
          this.transferModal.to = decodeData.to;
          this.getGasPrice();
        } else {
          //主资产转账
          const params = {
            chainId: this.MAIN_INFO.chainId,
            assetId: this.MAIN_INFO.assetId
          };
          // console.log(params, 888);
          const amount = this.eTransfer.formatEther(value);
          // console.log(amount, 999);
          await this.getTransferAsset(params, amount);
          this.transferModal.amount = amount;
        }
      },

      async initNtransfer() {
        const {contractAddress, value, assetChainId: chainId, assetId} = this.transferModal;
        this.transferModal.amount = value;
        const params = contractAddress ? {contractAddress} : {chainId, assetId};
        await this.getTransferAsset(params);
        await this.validateParameter();
      },

      // 计算eth bnb跨链转账手续费
      async getGasPrice() {
        this.feeLoading = true;
        const gasLimit = this.chooseAsset.contractAddress ? "100000" : "35000";
        // console.log(gasLimit, "gasLimit");
        this.fee = await this.eTransfer.getGasPrice(gasLimit);
        // console.log(this.fee, "getGasPrice");
        this.feeLoading = false;
      },

      // 计算eth bnb加速跨链转账手续费
      async getSpeedUpFee() {
        this.feeLoading = true;
        const gasLimit = this.chooseAsset.contractAddress ? "100000" : "35000";
        this.fee = await this.eTransfer.getSpeedUpFee(gasLimit);
        this.feeLoading = false;
      },

      async changeSpeedUpFee(e) {
        if (e) {
          this.getSpeedUpFee();
        } else {
          this.getGasPrice();
        }
      },

      async getTransferAsset(data, amount) {
        const params = {chain: this.chain, address: this.transferModal.from, refresh: true, ...data};
        const res = await this.$request({url: "/wallet/address/asset", data: params});
        console.log(res, 'getTransferAsset');
        if (res.code === 1000) {
          this.loading = false;
          res.data.balance = divisionDecimals(res.data.balance, res.data.decimals);
          this.chooseAsset = res.data;
          if (this.chain !== "NULS" && this.chain !== "NERVE") {
            this.getGasPrice();
          }
          this.transferModal.symbol = res.data.symbol;
          if (amount) {
            this.transferModal.amount = divisionDecimals(amount, res.data.decimals);
          }
        } else if (res.data === "asset not exist") {
          this.loading = false;
          this.getAssetFailCount++;
          await this.foucusAsset(data);
          if (this.getAssetCount < 5) {
            setTimeout(() => {
              this.getTransferAsset(data, amount);
            }, 1000);
          } else {
            this.errorTip = this.$t("transfer.transfer27");
          }
        }
      },

      async foucusAsset(data) {
        const params = {chain: this.chain, address: this.transferModal.from, focus: true, ...data};
        await this.$request({url: "/wallet/address/asset/focus", data: params});
      },

      validateParameter() {
        // 默认普通转账type=2  eth，bsc不涉及type
        this.nulsType = "";
        this.type = 2;
        if (!this.transferModal.to || !this.transferModal.amount) return;
        if (this.chooseAsset.contractAddress) {
          // nuls 合约资产  普通token转账、向合约地址转token
          this.nulsType = "tokenTransfer";
          this.type = 16;
          this.validataContract("transfer");
          // this.transferTransfer();
        } else {
          // nuls 本链资产 普通nuls转账 向合约地址转nuls
          this.nulsType = "nulsTransfer";
          const toType = nuls.verifyAddress(this.transferModal.to);
          if (toType.type === 2) { // 合约地址
            //向合约地址转nuls
            this.nulsType = "nulsToContract";
            this.type = 16;
            this.validataContract("_payable");
            // this.transferPayable();
          } else {
            this.type = 2;
            this.nulsType = "nulsTransfer";
            this.fee = 0.001;
          }
        }
      },

      async validataContract(method) {
        this.feeLoading = true;
        const {from, to, value} = this.transferModal;
        const res = await getContractCallData(
          from,
          to,
          this.transferModal.price,
          this.chooseAsset.contractAddress,
          method,
          value,
          this.chooseAsset.decimals
        );
        if (res.success) {
          this.fee = res.data.fee;
          this.transferModal.gas = res.data.gas;
          this.contractCallData = res.data.contractCallData;
        } else {
          this.$message({message: res.msg, type: "warning", duration: 2000});
        }
        this.feeLoading = false;
      },

      checkForm(formName) {
        this.$refs[formName].validate(async valid => {
          if (valid) {
            this.showConfirm = true;
          } else {
            return false;
          }
        });
      },

      async submit() {
        let txHex = "";
        this.loading = true;
        const priInfo = await this.getPriAndPubKey(this.transferModal.from);
          if (!priInfo) {
            this.respond({success: false, data: "sign error"});
            return;
          }
        if (this.chain === "NULS" || this.chain === "NERVE") {
          const transfer = new NTransfer({chain: this.chain, network: this.network, type: this.type});
          const transferInfo = {
            from: this.transferModal.from,
            to: this.transferModal.to,
            assetsChainId: this.chooseAsset.chainId,
            assetsId: this.chooseAsset.assetId,
            amount: timesDecimals(this.transferModal.amount, this.chooseAsset.decimals),
            fee: timesDecimals(this.fee, this.MAIN_INFO.decimal)
          };
          if (this.type === 16) {
            transferInfo.assetsChainId = this.MAIN_INFO.chainId;
            transferInfo.assetsId = this.MAIN_INFO.assetId;
            if (this.nulsType === "nulsToContract") {
              //向合约地址转nuls
              this.contractCallData.chainId = this.MAIN_INFO.chainId;
              transferInfo.toContractValue = transferInfo.amount;
              transferInfo.amount = Plus(transferInfo.fee, Times(this.transferModal.gas, this.transferModal.price)).toFixed();
              transferInfo.amount = Plus(transferInfo.amount, transferInfo.toContractValue).toFixed();
            } else if (this.nulsType === "tokenTransfer") {
              // token转账 向合约地址转token
              transferInfo.amount = Plus(0, Times(this.transferModal.gas, this.transferModal.price)).toFixed();
            }
          }
          const inputOuput = await transfer.inputsOrOutputs(transferInfo);
          const txData = this.type === 16 ? this.contractCallData : {};
          try {
            txHex = await transfer.getTxHex({
              inputs: inputOuput.inputs,
              outputs: inputOuput.outputs,
              remarks: this.transferModal.remarks,
              txData
            }, priInfo.pri, priInfo.pubKey);
          } catch (e) {
            console.error("签名失败" + e);
            this.loading = false;
            this.$message({type: "warning", message: e, duration: 2000});
            this.respond({success: false, data: e});
            return;
          }
        } else {
          try {
            console.log(this.transferModal);
            let data = {
              /*to: this.transferModal.params[0].to,
              value: this.transferModal.params[0].value,
              upSpeed: this.speedUpFee, //是否加速
              contractAddress: this.chooseAsset.contractAddress,
              tokenDecimals: this.chooseAsset.decimals*/

              from:  this.transferModal.params[0].from,
              to:  this.transferModal.params[0].to,
              data: this.transferModal.params[0].data,
              value: this.transferModal.params[0].value,

            };
            console.log(data, 123456789);
            txHex = await this.eTransfer.getTxHexThree(data, priInfo.pri);
          } catch (e) {
            console.error("组装交易失败" + e);
            this.loading = false;
            this.$message({type: "warning", message: e, duration: 2000});
            this.respond({success: false, data: e});
            return;
          }
        }
        if (this.transferModal.sign) {
          this.loading = false;
          this.showConfirm = false;
          this.respond({success: true, data: txHex});
        } else {
          this.broadcastTx(txHex);
        }
      },

      //广播交易
      async broadcastTx(txHex) {
        const assetInfo = this.chooseAsset.contractAddress
          ? {contractAddress: this.chooseAsset.contractAddress}
          : {chainId: this.chooseAsset.chainId, assetId: this.chooseAsset.assetId};
        const params = {chain: this.chain, address: this.transferModal.from, txHex, ...assetInfo};
        const res = await this.$request({url: "/tx/transfer", method: "post", data: params});
        this.loading = false;
        this.showConfirm = false;
        if (res.code === 1000) {
          this.$message({type: "success", message: this.$t("transfer.transfer13"), duration: 2000});
          this.respond({success: true, data: res.data});
        } else {
          this.$message({type: "warning", message: res.msg, duration: 2000});
          this.respond({success: false, data: res.msg});
        }
      },

      /* close() {
        setTimeout(() => {
          NotificationService.close();
        }, 1000)
      },

      reject() {
        this.notification.responder(false);
        this.close();
      },

      respond(data) {
        this.notification.responder(data);
        //this.close();
      } */
    }
  };
</script>
<style lang="less">
  .send-transaction {
    .content {
      padding-top: 30px;
    }
    .address-validate-error {
      line-height: 1!important;
      font-size: 12px!important;
    }
    .btn-wrap {
      text-align: center;
      margin-top: 30px;
      .el-button {
        height: 35px;
        border-radius: 5px;
        font-size: 12px;
        padding: 12px 0px;
        width: 120px;
        & + .el-button {
          margin-left: 20px;
        }
      }
    }
  }
</style>

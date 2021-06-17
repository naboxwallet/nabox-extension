<template>
  <div class="send-cross-transaction transfer-page" v-loading="transferLoading">
    <transition name="fade-transform" mode="out-in">
      <div v-show="!showConfirm">
        <div class="content">
          <el-form label-position="top" :model="transferModal" :rules="transferRules" ref="transferForm">
            <el-form-item :label="'From(' + chain + ')'">
              <el-input disabled :value="superLong(transferModal.from)">
              </el-input>
            </el-form-item>
            <el-form-item :label="'To(' + transferModal.network + ')'">
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
            <p class="approve-tip" v-if="isCrossIn && needAllowance">
              <img v-if="refreshAllowance" src="../../assets/img/loading.svg"/>
              <template v-else>
                <span>{{ $t("transfer.transfer22") }}</span>
                <br/>
                <el-button type="text" @click="approveERC20">
                  {{ $t("transfer.transfer23") }}
                </el-button>
                &nbsp;&nbsp;
                <i class="el-icon-refresh click" @click="getERC20Allowance"></i>
              </template>
            </p>
            <el-form-item :label="$t('public.remark')">
              <el-input type="textarea" v-model="transferModal.remarks" maxlength="200" show-word-limit>
              </el-input>
            </el-form-item>
            <div class="fee-wrap">
              <p class="fee-label">{{ $t("public.fee") }}</p>
              <span v-if="!feeLoading">
                {{ fee }}{{ feeSymbol }}
                <span v-if="nerveToNuls"> + {{ crossFee }}NULS</span>
              </span>
              <img v-else src="../../assets/img/loading.svg"/>
              <el-checkbox v-if="isWithdrawal || isCrossIn" v-model="speedUpFee" @change="changeSpeedUpFee">
                {{ $t("transfer.transfer14") }}
              </el-checkbox>
            </div>
            <div class="btn-wrap">
              <el-button @click="reject">{{ $t("public.cancel") }}</el-button>
              <el-button type="primary" @click="checkForm('transferForm')" :disabled="transferLoading">
                {{ $t("public.next") }}
              </el-button>
            </div>
          </el-form>
        </div>
      </div>
    </transition>
    <transfer-confirm :data="confirmData" :visiable.sync="showConfirm" @confirm="submit">
    </transfer-confirm>
  </div>
</template>

<script>
  import TransferConfirm from "@/components/TransferConfirm";
  import NotificationService from "@/utils/NotificationService";
  import {
    superLong,
    timesDecimals,
    Plus,
    Times,
    divisionDecimals,
    getSymbolUSD,
    Minus,
    chainToSymbol,
    getStorage
  } from "@/utils/util";
  import nerve from "nerve-sdk-js";
  import {NTransfer, ETransfer, crossFee, validateAddress} from "@/utils/api";
  import {getContractCallData} from "@/utils/nulsContractValidate";

  export default {
    data() {
      const validateTo = (rule, value, callback) => {
        let to = {};
        const isEAddress = validateAddress(value); //验证是否是以太坊地址
        try {
          to = nerve.verifyAddress(value);
        } catch (e) {
          console.error(e)
        }
        if (value === "") {
          callback(new Error(this.$t("transfer.transfer1")));
        } else if (this.chain === "NERVE") {
          const from = nerve.verifyAddress(this.transferModal.from);
          if (to.chainId) {
            if (from.chainId === to.chainId) {
              callback(new Error(this.$t("transfer.transfer15")));
            } else {
              callback();
            }
          } else if (isEAddress) {
            callback();
          } else {
            callback(new Error(this.$t("transfer.transfer15")));
          }
        } else {
          const NERVEChainId = this.$store.state.network === "beta" ? 5 : 9;
          //console.log(to, NERVEChainId, 9988);
          if (to.chainId === NERVEChainId) {
            callback();
          } else {
            callback(new Error(this.$t("transfer.transfer15")));
          }
        }
      };
      const validataSymbol = async (rule, value, callback) => {
        if (this.chain !== "NERVE" && this.chain !== "NULS" && !this.heterogeneousChain_In.heterogeneousChainId) {
          callback(new Error(this.$t("transfer.transfer24") + "NERVE"));
        } else if (this.isWithdrawal && !this.heterogeneousChain_Out.heterogeneousChainId) {
          callback(
            new Error(this.$t("transfer.transfer24") + this.transferModal.network)
          );
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
          if (this.chain === "NULS") {
            this.validateParameter();
          }
          callback();
        }
      };
      this.normalFee = 0.001;
      this.network = "";
      this.MAIN_INFO = {};
      this.getAssetFailCount = 0;
      return {
        transferLoading: true,
        notification: {},
        chain: "",
        transferModal: {
          from: "",
          network: "",
          to: "",
          symbol: "",
          amount: "",
          remarks: "",
          gas: 1,
          price: 25
        },
        transferRules: {
          to: [{validator: validateTo, trigger: ["blur"]}],
          symbol: [{validator: validataSymbol, trigger: ["change"]}],
          amount: [{validator: validateAmount, trigger: ["blur"]}]
        },
        fee: "",
        crossFee: crossFee, //nerve nuls 跨链手续费
        assetsList: [], //资产列表
        chooseAsset: {}, //选择的转账资产
        contractCallData: {}, //合约信息
        showConfirm: false,
        feeSymbol: "", //手续费符号
        speedUpFee: false, // eth bsc加速
        feeLoading: false,
        custom: false, // nerve提现到eth bsc是否自定义手续费
        feeType: 2, //手续费等级 1：慢，2：中，3：快
        withdrawalFeeForETH: "", //提现手续费兑eth
        type: 10, //nerve nuls 交易类型
        heterogeneousChain_In: {}, // 跨链转入异构链
        heterogeneousChain_Out: {}, // 跨链转出的异构链
        needAllowance: false, // erc20 资产跨链转入到nerve是否需要授权
        refreshAllowance: true,
      };
    },

    components: {
      TransferConfirm
    },

    watch: {},

    computed: {

      nerveToNuls() {
        return this.chain === "NERVE" && this.transferModal.network === "NULS";
      },

      isWithdrawal() {
        return this.chain === "NERVE" && this.transferModal.network && this.transferModal.network !== "NULS";
      },

      // 是否是eth 、bnb跨链到nerve
      isCrossIn() {
        return this.chain !== "NULS" && this.chain !== "NERVE";
      },

      confirmData() {
        const fee =
          this.chain === "NERVE" && this.transferModal.network === "NULS"
            ? this.fee + this.feeSymbol + "+" + crossFee + "NULS"
            : this.fee + this.feeSymbol;
        return {
          from: superLong(this.transferModal.from, 12),
          to: superLong(this.transferModal.to, 12),
          amount: this.transferModal.amount,
          assetSymbol: this.chooseAsset.symbol,
          fee,
          remarks: this.transferModal.remarks
        };
      }
    },

    async created() {
      await this.init();
      this.transferLoading = false;
    },

    mounted() {
    },

    methods: {

      superLong(str, len = 12) {
        return superLong(str, len);
      },

      async init() {
        this.notification = chrome.extension.getBackgroundPage().notification;
        const txData = this.notification.data;
        this.transferModal = Object.assign(this.transferModal, txData);
        this.transferModal.network = txData.toChain;
        this.network = this.$store.state.network;

        const fromOrigin = this.notification.domain;
        const nabox = await getStorage("nabox", {});
        this.chain = nabox.allowSites.filter(v => v.origin === fromOrigin)[0].chain;
        //this.chain = "NULS"
        const accounts = this.$store.getters.currentAccount;
        this.transferModal.from = accounts[this.network][this.chain];
        this.feeSymbol = chainToSymbol[this.chain];
        const config = JSON.parse(localStorage.getItem("config"));
        this.MAIN_INFO = config[this.network][this.chain];

        if (this.chain !== "NULS" && this.chain !== "NERVE") {
          this.initEtransfer();
        } else {
          this.initNtransfer();
        }
      },

      async initEtransfer() {
        const {to, data, value} = this.transferModal;
        this.eTransfer = new ETransfer({chain: this.chain, network: this.network});
        const decodeData = this.eTransfer.decodeData(data);
        // console.log(decodeData, 55)
        if (decodeData) {
          const contractAddress = to;
          await this.getTransferAsset({contractAddress}, decodeData.amount);
          this.transferModal.to = decodeData.to;
        } else {
          //主资产转账
          const params = {chainId: this.MAIN_INFO.chainId, assetId: this.MAIN_INFO.assetId};
          const amount = this.eTransfer.formatEther(value);
          console.log(amount, 999);
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

      async getTransferAsset(data, amount) {
        const params = {chain: this.chain, address: this.transferModal.from, refresh: true, ...data};
        const res = await this.$request({url: "/wallet/address/asset", data: params});
        if (res.code === 1000) {
          res.data.balance = divisionDecimals(res.data.balance, res.data.decimals);
          this.chooseAsset = res.data;
          this.transferModal.symbol = res.data.symbol;
          if (amount) {
            this.transferModal.amount = divisionDecimals(amount, res.data.decimals);
          }
          this.getHeterogeneousChain();
          this.changeSpeedUpFee();
          if (this.isCrossIn) {
            this.getERC20Allowance();
          }
        } else if (res.data === "asset not exist") {
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

      // 获取跨链转入、跨链转出的异构链
      getHeterogeneousChain() {
        this.heterogeneousChain_In = {};
        this.heterogeneousChain_Out = {};
        // console.log(this.chooseAsset, 666)
        if (!this.chooseAsset.heterogeneousList) return;
        const heterogeneousChain_In = this.chooseAsset.heterogeneousList.filter(
          v => v.chainName === this.chain
        )[0];
        const heterogeneousChain_Out = this.chooseAsset.heterogeneousList.filter(
          v => v.chainName === this.transferModal.network
        )[0];
        console.log(heterogeneousChain_In, "in--out", heterogeneousChain_Out);
        this.heterogeneousChain_In = heterogeneousChain_In || {};
        this.heterogeneousChain_Out = heterogeneousChain_Out || {};
      },

      // ETH BSC 加速
      async changeSpeedUpFee(e) {
        if (this.isWithdrawal) {
          this.calculateFee();
        }
        if (this.isCrossIn) {
          if (e) {
            this.getSpeedUpFee();
          } else {
            this.getGasPrice();
          }
        }
      },

      // 计算eth bnb跨链转账手续费
      async getGasPrice() {
        this.feeLoading = true;
        const gasLimit = this.chooseAsset.contractAddress ? "100000" : "35000";
        this.fee = await this.eTransfer.getGasPrice(gasLimit);
        this.feeLoading = false;
      },

      // 计算eth bnb加速跨链转账手续费
      async getSpeedUpFee() {
        this.feeLoading = true;
        const gasLimit = this.chooseAsset.contractAddress ? "100000" : "35000";
        this.fee = await this.eTransfer.getSpeedUpFee(gasLimit);
        this.feeLoading = false;
      },

      //查询erc20资产授权额度
      async getERC20Allowance() {
        const {contractAddress, heterogeneousChainMultySignAddress, token} = this.heterogeneousChain_In;
        console.log(this.heterogeneousChain_In, "异构转入链info");
        this.refreshAllowance = true;
        this.needAllowance = false;
        if (token) {
          this.needAllowance = await this.eTransfer.getERC20Allowance(contractAddress, heterogeneousChainMultySignAddress, this.transferModal.from);
        }
        this.refreshAllowance = false;
      },

      // 计算nerve提现到eth bsc手续费
      async calculateFee() {
        this.feeLoading = true;
        const nvtUSD = await getSymbolUSD("NERVE");
        this.nvtUSD = nvtUSD + "";
        const heterogeneousChainUSD = await getSymbolUSD(this.transferModal.network);
        //异构链usd价格
        this.heterogeneousChainUSD = heterogeneousChainUSD + "";
        this.calWithdrawalNVTFee();
        // this.calWithdrawFee();
      },

      //获取默认手续费
      async calWithdrawalNVTFee() {
        const eTransfer = new ETransfer({chain: this.transferModal.network, network: this.network});
        const result = await eTransfer.calWithdrawalNVTFee(this.nvtUSD, this.heterogeneousChainUSD, this.heterogeneousChain_Out.token);
        const defaultFee = Number(divisionDecimals(result, this.MAIN_INFO.decimal));
        const chooseFee = this.speedUpFee ? defaultFee + 3 : defaultFee;
        this.fee = chooseFee + this.normalFee;
        this.feeLoading = false;
      },

      validateParameter() {
        // 默认跨链转账type=10  eth，bsc不涉及type
        this.type = 10;
        this.fee = crossFee;
        if (this.chain === "NULS") {
          if (!this.transferModal.to || !this.transferModal.amount) return;
          if (this.chooseAsset.contractAddress) {
            // nuls 合约资产跨链转账
            this.type = 16;
            this.transferCrossChain();
          } else {
            // nuls 本链资产跨链
          }
        } else if (this.chain === "NERVE") {
          if (
            this.transferModal.network &&
            this.transferModal.network !== "NULS"
          ) {
            this.type = 43;
          }
        }
      },

      // 验证合约、获取交易gas
      async transferCrossChain() {
        const res = await getContractCallData(
          this.transferModal.from,
          this.transferModal.to,
          this.transferModal.price,
          this.chooseAsset.contractAddress,
          "transferCrossChain",
          this.transferModal.amount,
          this.chooseAsset.decimals
        );
        if (res.success) {
          this.fee = res.data.fee;
          this.transferModal.gas = res.data.gas;
          this.contractCallData = res.data.contractCallData;
        } else {
          this.$message({message: res.msg, type: "warning", duration: 3000});
        }
      },

      async approveERC20() {
        const {contractAddress, heterogeneousChainMultySignAddress} = this.heterogeneousChain_In;
        const hex = await this.eTransfer.getApproveERC20Hex(contractAddress, heterogeneousChainMultySignAddress, this.transferModal.from);
        if (hex) {
          this.authorCross(hex)
        }
        console.log(hex, "授权hex");
      },

      // 广播授权交易
      async authorCross(txHex) {
        const res = await this.$request({url: "/tx/cross/author", data: {chain: this.chain, txHex}});
        if (res.code === 1000) {
          this.$message({type: "success", message: this.$t("transfer.transfer25"), duration: 2000});
        } else {
          this.$message({type: "warning", message: res.msg, duration: 3000});
        }
      },

      checkForm(formName) {
        this.$refs[formName].validate(valid => {
          if (valid) {
            this.showConfirm = true;
          } else {
            return false;
          }
        });
      },

      async submit() {
        this.transferLoading = true;
        let txHex = "";
        if (this.chain === "NULS" || this.chain === "NERVE") {
          const transfer = new NTransfer({chain: this.chain, network: this.$store.state.network, type: this.type});
          const transferInfo = {
            from: this.transferModal.from,
            to: this.transferModal.to,
            assetsChainId: this.chooseAsset.chainId,
            assetsId: this.chooseAsset.assetId,
            amount: timesDecimals(this.transferModal.amount, this.chooseAsset.decimals),
            fee: timesDecimals(this.fee, this.MAIN_INFO.decimal)
          };
          let txData = {};
          if (this.type === 16) {
            //nuls 合约token跨链
            transferInfo.assetsChainId = this.MAIN_INFO.chainId;
            transferInfo.assetsId = this.MAIN_INFO.assetId;
            transferInfo.amount = Plus(20000000, Times(this.transferModal.gas, this.transferModal.price)).toFixed();
            transferInfo.toContractValue = 10000000;
            transferInfo.to = this.chooseAsset.contractAddress;
            txData = this.contractCallData;
          } else if (this.type === 43) {
            if (this.chooseAsset.contractAddress) {
              transferInfo.fromChain = this.chain;
              transferInfo.contractAddress = this.chooseAsset.contractAddress;
            }
            transferInfo.proposalPrice = timesDecimals(Minus(this.fee, this.normalFee), this.MAIN_INFO.decimal);
            transferInfo.fee = timesDecimals(this.normalFee, this.MAIN_INFO.decimal);
            txData = {
              heterogeneousAddress: this.transferModal.to,
              heterogeneousChainId: this.heterogeneousChain_Out.heterogeneousChainId
            };
          }
          const inputOuput = await transfer.inputsOrOutputs(transferInfo);
          // txHex = await transfer.getTxHex(inputOuput.inputs, inputOuput.outputs, this.transferModal.remarks, txData);
          try {
            txHex = await transfer.getTxHex({
              inputs: inputOuput.inputs,
              outputs: inputOuput.outputs,
              remarks: this.transferModal.remarks,
              txData
            });
          } catch (e) {
            console.error("跨链交易签名失败" + e);
            this.$message({type: "warning", message: e, duration: 2000});
            this.respond({success: false, data: e});
            return;
          }
        } else {
          // 跨链转入
          console.log(this.heterogeneousChain_In, 123456);
          try {
            txHex = await this.eTransfer.getCrossInTxHex({
              from: this.transferModal.from,
              to: this.transferModal.to,
              value: this.transferModal.amount,
              upSpeed: this.speedUpFee, //是否加速
              multySignAddress: this.heterogeneousChain_In.heterogeneousChainMultySignAddress,
              contractAddress: this.heterogeneousChain_In.contractAddress,
              tokenDecimals: this.chooseAsset.decimals
            });
          } catch (e) {
            console.error("跨链交易签名失败" + e);
            this.$message({type: "warning", message: e, duration: 2000});
            this.respond({success: false, data: e});
            return;
          }
        }
        console.log(txHex, "====txHex====");
        if (this.transferModal.sign) {
          this.transferLoading = false;
          this.showConfirm = false;
          this.respond({success: true, data: txHex});
        } else {
          this.broadcastTxCross(txHex);
        }
      },

      async broadcastTxCross(txHex) {
        const assetInfo = this.chooseAsset.contractAddress
          ? {contractAddress: this.chooseAsset.contractAddress}
          : {chainId: this.chooseAsset.chainId, assetId: this.chooseAsset.assetId};
        const params = {
          fromChain: this.chain,
          toChain: this.transferModal.network,
          fromAddress: this.transferModal.from,
          toAddress: this.transferModal.to,
          txHex,
          ...assetInfo
        };
        const res = await this.$request({url: "/tx/cross/transfer", method: "post", data: params});
        this.transferLoading = false;
        this.showConfirm = false;
        if (res.code === 1000) {
          this.$message({type: "success", message: this.$t("transfer.transfer13"), duration: 2000});
          this.respond({success: true, data: res.data});
        } else {
          this.$message({type: "warning", message: res.msg, duration: 3000});
          this.respond({success: false, data: res.msg});
        }
      },

      close() {
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
        this.close();
      }
    }
  };
</script>
<style lang="less">
  .send-cross-transaction {
    .content {
      padding-top: 30px;
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

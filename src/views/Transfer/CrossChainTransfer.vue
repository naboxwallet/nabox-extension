<template>
  <div class="transfer-page" v-loading="transferLoading">
    <transition name="fade-transform" mode="out-in">
      <div v-show="!showConfirm">
        <common-head>{{ $t("home.home8") }}</common-head>
        <div class="content">
          <el-form
            label-position="top"
            :model="transferModal"
            :rules="transferRules"
            ref="transferForm"
          >
            <el-form-item label="From">
              <el-input disabled :value="superLong(transferModal.from)"></el-input>
            </el-form-item>
            <el-form-item :label="$t('public.network')" prop="network">
              <el-select v-model="transferModal.network">
                <el-option
                  v-for="item in networkList"
                  :label="item"
                  :value="item"
                  :key="item"
                  :disabled="checkDisable(item)"
                >
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="To" prop="to">
              <el-input v-model.trim="transferModal.to"></el-input>
            </el-form-item>
            <el-form-item :label="$t('public.symbol')">
              <el-select v-model="transferModal.symbol" @change="changeType">
                <el-option
                  v-for="item in assetsList"
                  :key="item.ids"
                  :label="item.symbol"
                  :value="item.ids"
                ></el-option>
              </el-select>
            </el-form-item>
            <span class="available">
              {{ $t("public.available") + ": " }}{{ chooseAsset.balance }}
            </span>
            <el-form-item :label="$t('public.amount')" prop="amount">
              <el-input v-model="transferModal.amount">
                <el-button slot="append">
                  {{ $t("public.all") }}
                </el-button>
              </el-input>
            </el-form-item>
            <el-form-item :label="$t('public.remark')">
              <el-input
                type="textarea"
                v-model="transferModal.remarks"
                maxlength="200"
                show-word-limit
              >
              </el-input>
            </el-form-item>
            <div class="fee">
              <label>{{ $t("public.fee") }}</label>
              <template v-if="isWithdrawal">
                <template v-if="!custom">
                  <img src="../../assets/img/loading.svg" v-if="feeLoading" />
                  <div v-else class="custom-wrap">
                    <el-radio-group
                      v-model="feeType"
                      @change="feeTypeChange"
                      size="mini"
                    >
                      <el-radio-button label="1">{{ $t("transfer.transfer17") }}</el-radio-button>
                      <el-radio-button label="2">{{ $t("transfer.transfer18") }}</el-radio-button>
                      <el-radio-button label="3">{{ $t("transfer.transfer19") }}</el-radio-button>
                    </el-radio-group>
                    <span class="fee-number">
                      {{ fee }}
                      {{ feeSymbol }}
                    </span>
                    <el-button type="text" @click="custom = true">{{ $t("transfer.transfer20") }}</el-button>
                  </div>
                </template>
                <template v-else>
                  <el-input
                    v-model="withdrawalFeeForETH"
                    @input="customFeeChange"
                    class="custom-input"
                  >
                    <template slot="append">{{ selectHeterogeneousChain }}</template>
                  </el-input>
                  <span class="fee-transform">
                    ≈ <span>{{ ETHToNVT }} {{ feeSymbol }}</span>
                  </span>
                  <el-button
                    class="cancel-btn"
                    type="text"
                    @click="custom = false"
                  >
                    {{ $t("public.cancel") }}
                  </el-button>
                  <el-button type="text" @click="customFee">{{ $t("public.confirm") }}</el-button>
                </template>
              </template>
              <template v-else>
                <span v-if="!feeLoading">
                  {{ fee }}{{ feeSymbol }}
                  <span v-if="nerveToNuls"> + {{ crossFee }}NULS</span>
                </span>
                <img v-else src="../../assets/img/loading.svg" />
                <el-checkbox
                  v-if="chain === 'Ethereum' || chain === 'BSC'"
                  v-model="speedUpFee"
                  @change="changeSpeedUpFee"
                >
                  {{ $t("transfer.transfer14") }}
                </el-checkbox>
              </template>
            </div>
            <el-button
              class="btn"
              type="primary"
              @click="checkForm('transferForm')"
            >
              {{ $t("public.next") }}
            </el-button>
          </el-form>
        </div>
      </div>
    </transition>
    <transfer-confirm
      :data="confirmData"
      :visiable.sync="showConfirm"
      @confirm="submit"
    ></transfer-confirm>
  </div>
</template>

<script>
import CommonHead from "@/components/CommonHead";
import TransferConfirm from "@/components/TransferConfirm";
import { superLong, timesDecimals, Plus, Division, Times, divisionDecimals, getSymbolUSD, Minus } from "@/utils/util";
import nerve from "nerve-sdk-js";
import sdk from "nerve-sdk-js/lib/api/sdk";
import utils from "nuls-sdk-js/lib/utils/utils";
import { NTransfer, ETransfer, crossFee, validateAddress } from "@/utils/api";
const feeSymbol = {
  NULS: "NULS",
  NERVE: "NVT",
  Ethereum: "ETH",
  BSC: "BNB"
};
export default {
  data() {
    const validateTo = (rule, value, callback) => {
      let to = {};
      const isEAddress = validateAddress(value); //验证是否是以太坊地址
      try {
        to = nerve.verifyAddress(value);
      } catch (e) {
        // console.error(e)
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
        console.log(to, NERVEChainId, 9988)
        if (to.chainId === NERVEChainId) {
          callback();
        } else {
          callback(new Error(this.$t("transfer.transfer15")));
        }
      }
    };
    const validateNetwork = (rule, value, callback) => {
      if (value === "") {
        callback(new Error(this.$t("transfer.transfer16")));
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
        // if (this.chooseAsset.contractAddress) this.contractInfoByContractAddress(this.assetsInfo.contractAddress)
        if (this.chain === "NULS") {
          this.validateParameter();
        }
        callback();
      }
    };
    this.normalFee = 0.001;
    return {
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
        to: [{ validator: validateTo, trigger: ["blur"] }],
        network: [{ validator: validateNetwork }],
        amount: [{ validator: validateAmount, trigger: ["blur"] }]
      },
      networkList: ["NULS", "NERVE", "Ethereum", "BSC"],
      fee: "",
      crossFee: crossFee, //nerve nuls 跨链手续费
      assetsList: [], //资产列表
      chooseAsset: {}, //选择的转账资产
      contractCallData: {}, //合约信息
      showConfirm: false,
      feeSymbol: "", //手续费符号
      speedUpFee: false, // eth bsc加速
      feeLoading: true,
      custom: false, // nerve提现到eth bsc是否自定义手续费
      feeType: 2, //手续费等级 1：慢，2：中，3：快
      withdrawalFeeForETH: "", //提现手续费兑eth
      ETHToNVT: "", // 异构网络币价格兑NVT
      selectHeterogeneousChain: "ETH",
      type: 10, //nerve nuls 交易类型
      transferLoading: false
    };
  },

  components: {
    CommonHead,
    TransferConfirm
  },

  watch: {
    "transferModal.network"(val) {
      // this.$refs.transferForm.validateField("to");
      const network = this.$store.state.network;
      if (this.chain === "NERVE") {
        if (val === "Ethereum" || val === "BSC") {
          // this.showCustomFee();
          this.type = 43;
          this.selectHeterogeneousChain = feeSymbol[val];
          this.eTransfer = new ETransfer({
            chain: val,
            network
          });
          this.calculateFee();
        } else {
          this.feeLoading = false;
          this.fee = crossFee;
        }
      } else if (this.chain === "NULS") {
        this.feeLoading = false;
        this.fee = crossFee;
      } else {
        this.eTransfer = new ETransfer({
          chain: this.chain,
          network
        });
        this.getGasPrice();
      }
    }
  },

  computed: {
    nerveToNuls() {
      return this.chain === "NERVE" && this.transferModal.network === "NULS";
    },
    isWithdrawal() {
      return (
        this.chain === "NERVE" &&
        (this.transferModal.network === "Ethereum" ||
          this.transferModal.network === "BSC")
      );
    },
    confirmData() {
      const fee =
        this.chain === "NERVE" && this.transferModal.network === "NULS"
          ? this.fee + this.feeSymbol + crossFee + "NULS"
          : this.fee + this.feeSymbol;
      return {
        from: superLong(this.transferModal.from, 12),
        to: superLong(this.transferModal.to, 12),
        amount: this.transferModal.amount,
        assetSymbol: this.chooseAsset.symbol,
        fee,
        remarks: this.transferModal.remarks
      };
    },
  },

  async created() {
    const { address, chain, assetChainId, assetId, contractAddress } = this.$route.query;
    const network = this.$store.state.network;
    const config = JSON.parse(sessionStorage.getItem("config"));
    this.sessionConfig = config[network];
    this.chain = chain;
    this.transferModal.from = address;
    this.assetChainId = assetChainId;
    this.assetId = assetId;
    this.contractAddress = contractAddress;
    this.feeSymbol = feeSymbol[this.chain];
    await this.getAssetsList();
    if (this.chain === "Ethereum" || this.chain === "BSC") {
      this.eTransfer = new ETransfer({
        chain: this.chain,
        network
      });
      this.getGasPrice();
    } else {
      this.MAIN_INFO = this.sessionConfig[this.chain];
      console.log(this.MAIN_INFO, "==MAIN_INFO==")
    }
  },

  mounted() {},

  methods: {
    checkDisable(network) {
      if (this.chain === "NERVE") {
        return network === "NERVE" ? true : false;
      } else {
        return network === "NERVE" ? false : true;
      }
    },
    superLong(str, len = 12) {
      return superLong(str, len);
    },
    getKey(item) {
      return item.contractAddress
        ? item.contractAddress
        : item.chainId + "-" + item.assetId;
    },
    async getAssetsList() {
      const params = {
        chain: this.chain,
        address: this.transferModal.from
      };
      const res = await this.$request({
        url: "/wallet/address/assets",
        data: params
      });
      if (res.code === 1000) {
        res.data.map(v => {
          v.balance = divisionDecimals(v.balance, v.decimals);
          v.ids = this.getKey(v);
          if (this.contractAddress && this.contractAddress === v.contractAddress) {
            this.chooseAsset = v;
            this.transferModal.symbol = v.contractAddress;
          } else {
            if (v.chainId == this.assetChainId && v.assetId == this.assetId) {
              this.chooseAsset = v;
              this.transferModal.symbol = v.chainId + "-" + v.assetId;
            }
          }
          if (v.heterogeneousList && v.heterogeneousList.length) {
            const symbolToChain = {
              ETH: "Ethereum",
              BNB: "BSC",
              HT: "Heco"
            }
            v.heterogeneousList.map(item => {
              item.network = symbolToChain[item]
            })
          }
        });
        this.assetsList = res.data;
      }
    },
    // 选择资产
    changeType(item) {
      this.chooseAsset = this.assetsList.filter(v => item === v.ids)[0];
      // this.chooseAsset = item; //选择的转账资产
      this.validateParameter();
    },
    // ETH BSC 加速
    async changeSpeedUpFee(e) {
      if (e) {
        this.getSpeedUpFee();
      } else {
        this.getGasPrice();
      }
    },
    // 计算eth bnb跨链转账手续费
    async getGasPrice() {
      this.feeLoading = true;
      const gasLimit = this.chooseAsset.contractAddress ? "100000" : "33594";
      this.fee = await this.eTransfer.getGasPrice(gasLimit);
      this.feeLoading = false;
    },
    // 计算eth bnb加速跨链转账手续费
    async getSpeedUpFee() {
      this.feeLoading = true;
      const gasLimit = this.chooseAsset.contractAddress ? "100000" : "33594";
      this.fee = await this.eTransfer.getSpeedUpFee(gasLimit);
      this.feeLoading = false;
    },
    // 计算nerve提现到eth bsc手续费
    async calculateFee() {
      this.feeLoading = true;
      const nvtUSD = await getSymbolUSD("NERVE");
      this.nvtUSD = nvtUSD + "";
      const heterogeneousChainUSD = await getSymbolUSD(this.transferModal.network);
      //异构链usd价格
      this.heterogeneousChainUSD = heterogeneousChainUSD + "";
      // 选中的提现异构链
      const heterogeneousChain = this.chooseAsset.heterogeneousList.filter(
        v => v.chainName === this.transferModal.network
      )[0];
      this.heterogeneousChain = heterogeneousChain;
      this.calWithdrawalNVTFee();
      this.calWithdrawFee();
    },

    //获取默认手续费
    async calWithdrawalNVTFee() {
      const result = await this.eTransfer.calWithdrawalNVTFee(
        this.nvtUSD,
        this.heterogeneousChainUSD,
        this.heterogeneousChain.token
      );
      const defaultFee = Number(
        divisionDecimals(result, this.MAIN_INFO.decimal)
      );
      const slow = defaultFee - 3 < 1 ? 1 : defaultFee - 3;
      const fast = defaultFee + 3;
      this.fee = defaultFee + this.normalFee;
      this.defaultFeeList = [slow, defaultFee, fast];
      this.feeLoading = false;
    },
    //默认手续费 --- eth
    async calWithdrawFee() {
      const result = await this.eTransfer.calWithdrawFee(this.heterogeneousChain.token);
      this.withdrawalFeeForETH = result;
      this.customFeeChange(result);
    },
    // 修改提现手续费等级
    feeTypeChange(val) {
      this.fee = this.defaultFeeList[val - 1] + this.normalFee;
    },
    //确定自定义手续费金额
    customFee() {
      this.fee = Number(this.ETHToNVT) + this.normalFee;
      this.feeType = 0;
      this.custom = false;
    },
    // 修改自定义手续费
    customFeeChange(val) {
      const reg = new RegExp("^([1-9][\\d]{0,20}|0)(\\.[\\d]{0,8})?$");
      if (!reg.test(val)) {
        this.withdrawalFeeForETH = val.slice(0, -1);
      } else {
        if (val) {
          const tonvt = this.eTransfer.calNvtByEth(this.nvtUSD, val, this.heterogeneousChainUSD);
          this.ETHToNVT = divisionDecimals(tonvt, this.MAIN_INFO.decimal);
        } else {
          this.ETHToNVT = 0;
        }
      }
    },

    validateParameter() {
      // 默认跨链转账type=10  eth，bsc不涉及type
      this.type = 10;
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
          this.calculateFee();
        }
      }
    },
    transferCrossChain() {
      let gasLimit = sdk.CONTRACT_MAX_GASLIMIT;
      let price = this.transferModal.price;
      let contractAddress = this.chooseAsset.contractAddress;
      let methodName = "transferCrossChain";
      let methodDesc = "";
      let args = [this.transferModal.to, timesDecimals(this.transferModal.amount, this.chooseAsset.decimals)];
      let newValue = Number(timesDecimals(0.1, 8));
      this.validateContractCall(this.transferModal.from, newValue, gasLimit, price, contractAddress, methodName, methodDesc, args);
    },

    /**
     * 验证调用合约交易
     * @param sender
     * @param value
     * @param gasLimit
     * @param price
     * @param contractAddress
     * @param methodName
     * @param methodDesc
     * @param args
     */
    async validateContractCall(sender, value, gasLimit, price, contractAddress, methodName, methodDesc, args) {
      //console.log(sender, value, gasLimit, price, contractAddress, methodName, methodDesc, args);
      try {
        const params = {
          chain: this.chain,
          address: sender,
          value,
          gasLimit,
          gasPrice: price,
          contractAddress,
          methodName,
          methodDesc,
          args
        };
        const res = await this.$request({
          url: "/contract/validate/call",
          data: params
        });
        if (res.code === 1000) {
          this.imputedContractCallGas(sender, value, contractAddress, methodName, methodDesc, args)
        } else {
          this.$message({
            message: this.$t("transfer.transfer10") + res.msg,
            type: "error",
            duration: 3000
          });
        }
      } catch (e) {
        this.$message({
          message: this.$t("transfer.transfer10"),
          type: "error",
          duration: 3000
        });
      }
    },

    /**
     * 预估调用合约交易的gas
     * @param sender
     * @param value
     * @param contractAddress
     * @param methodName
     * @param methodDesc
     * @param args
     */
    async imputedContractCallGas(sender, value, contractAddress, methodName, methodDesc, args) {
      try {
        const params = {
          chain: this.chain,
          address: sender,
          value,
          contractAddress,
          methodName,
          methodDesc,
          args
        };
        const res = await this.$request({
          url: "/contract/imputed/call/gas",
          data: params
        });
        if (res.code === 1000) {
          this.transferModal.gas = res.data.gasLimit;
          this.fee = Number(Plus(Division(Times(this.transferModal.gas, this.transferModal.price), 10000000), 0.001));
          let contractConstructorArgsTypes = await this.getContractMethodArgsTypes(contractAddress, methodName);
          if (!contractConstructorArgsTypes.success) {
            console.log(JSON.stringify(contractConstructorArgsTypes.data));
            return;
          }
          let newArgs = utils.twoDimensionalArray(args, contractConstructorArgsTypes.data);
          this.contractCallData = {
            chainId: this.MAIN_INFO.chainId,
            sender: sender,
            contractAddress: contractAddress,
            value: value,
            gasLimit: this.transferModal.gas,
            price: this.transferModal.price,
            methodName: methodName,
            methodDesc: methodDesc,
            args: newArgs
          };
        } else {
          this.$message({
            message: this.$t("transfer.transfer12") + res.msg,
            type: "error",
            duration: 3000
          });
        }
      } catch (e) {
        this.$message({
          message: this.$t("transfer.transfer12"),
          type: "error",
          duration: 3000
        });
      }
    },
    // 获取合约指定函数的参数类型
    async getContractMethodArgsTypes(contractAddress, methodName) {
      const params = {
        chain: this.chain,
        contractAddress,
        methodName,
        methodDesc: ""
      };
      const res = await this.$request({
        url: "/contract/method/args/type",
        data: params
      });
      if (res.code === 1000) {
        return { success: true, data: res.data };
      } else {
        return { success: false, data: res.data };
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
        const transfer = new NTransfer({
          chain: this.chain,
          network: this.$store.state.network,
          type: this.type
        });
        const transferInfo = {
          from: this.transferModal.from,
          to: this.transferModal.to,
          assetsChainId: this.chooseAsset.chainId,
          assetsId: this.chooseAsset.assetId,
          amount: timesDecimals(this.transferModal.amount, this.chooseAsset.decimals),
          fee: timesDecimals(this.fee, this.MAIN_INFO.decimal)
        };
        if (this.type === 16) {
          //nuls 合约token跨链
          transferInfo.assetsChainId = this.MAIN_INFO.chainId;
          transferInfo.assetsId = this.MAIN_INFO.assetId;
          transferInfo.amount = Plus(20000000, Times(this.transferModal.gas, this.transferModal.price)).toFixed();
          transferInfo.toContractValue = 10000000;
          transferInfo.to = this.chooseAsset.contractAddress;
        } else if (this.type === 43) {
          transferInfo.proposalPrice = timesDecimals(Minus(this.fee, this.normalFee), this.MAIN_INFO.decimal);
          transferInfo.fee = timesDecimals(this.normalFee, this.MAIN_INFO.decimal)
        }
        const inputOuput = await transfer.inputsOrOutputs(transferInfo);
        const withdrawalTxData = {
          heterogeneousAddress: this.transferModal.to,
          heterogeneousChainId: this.heterogeneousChain.heterogeneousChainId
        };
        const txData =
          this.type === 16
            ? this.contractCallData
            : this.type === 43
            ? withdrawalTxData
            : {};
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
          this.$message({
            type: "error",
            message: e,
            duration: 2000
          });
        }
      } else {
        // 跨链转入
        // 异构链id eth 101， bnb 102， ht 103
        const heterogeneousChainId = this.chain === "BSC" ? 102 : 101;
        const heterogeneousChainInfo = this.chooseAsset.heterogeneousList.filter(
          item => item.heterogeneousChainId === heterogeneousChainId
        )[0];
        // console.log(this.chooseAsset, 555)
        try {
          txHex = await this.eTransfer.getCrossInTxHex({
            from: this.transferModal.from,
            to: this.transferModal.to,
            value: this.transferModal.amount,
            upSpeed: this.speedUpFee, //是否加速
            multySignAddress: heterogeneousChainInfo.heterogeneousChainMultySignAddress,
            contractAddress: heterogeneousChainInfo.contractAddress,
            tokenDecimals: this.chooseAsset.decimals
          });
        } catch (e) {
          console.error("跨链交易签名失败" + e);
          this.$message({
            type: "error",
            message: e,
            duration: 2000
          });
        }
      }
      this.transferLoading = false;
      console.log(txHex, "====txHex====")
      if (txHex) {
        this.broadcastTxCross(txHex);
      } else {
        console.error("签名失败");
      }
    },
    async broadcastTxCross(txHex) {
      const params = {
        fromChain: this.chain,
        toChain: this.transferModal.network,
        fromAddress: this.transferModal.from,
        toAddress: this.transferModal.to,
        txHex
      };
      const res = await this.$request({
        url: "/tx/cross/transfer",
        method: "post",
        data: params
      });
      if (res.code === 1000) {
        this.$message({
          type: "success",
          message: this.$t("transfer.transfer13"),
          duration: 3000
        });
      } else {
        this.$message({
          type: "error",
          message: res.msg,
          duration: 3000
        });
      }
    }
  }
};
</script>
<style lang="less">
.transfer-page {
  height: 100%;
  overflow-y: auto;
  // padding-bottom: 50px;
  .content {
    padding: 10px 25px 0;
    .fee {
      .custom-wrap {
        display: flex;
        align-items: center;
        .fee-number {
          margin: 0 5px;
        }
      }
      .el-button {
        font-size: 12px;
      }
      .el-radio-group {
        .el-radio-button {
          margin-right: 0;
        }
        .el-radio-button__inner {
          padding: 2px 10px;
          border-radius: 0;
        }
      }
      .custom-input {
        width: 45%;
        input {
          height: 32px;
          line-height: 32px;
        }
        .el-input-group__append {
          font-size: 12px;
        }
      }
    }
    .btn {
      width: 100%;
      margin-top: 20px;
    }
  }
}
</style>

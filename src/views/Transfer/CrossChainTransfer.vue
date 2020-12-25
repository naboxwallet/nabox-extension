<template>
  <div class="transfer-page">
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
              <el-select v-model="transferModal.symbol">
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
                      {{ withdrawalFee + normalFee }} 
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
import { superLong, timesDecimals, Plus, Division, Times, divisionDecimals } from "@/utils/util";
import nerve from "nerve-sdk-js";
import sdk from "nerve-sdk-js/lib/api/sdk";
import utils from "nuls-sdk-js/lib/utils/utils";
import { validateAddress } from "@/utils/api_ethers";
import { NTransfer, ETransfer, crossFee } from "@/utils/api";
export default {
  data() {
    const validateTo = (rule, value, callback) => {
      const from = nerve.verifyAddress(this.transferModal.from);
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
      } else if (value > this.available) {
        callback(new Error(this.$t("transfer.transfer4") + ": " + this.available));
      } else {
        if (this.chain === "NULS") {
          // if (this.chooseAsset.contractAddress) this.contractInfoByContractAddress(this.assetsInfo.contractAddress)
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
      feeLoading: false,
      custom: false, // nerve提现到eth bsc是否自定义手续费
      feeType: 2, //手续费等级 1：慢，2：中，3：快
      withdrawalFee: "", //提现手续费
      withdrawalFeeForETH: "", //提现手续费兑eth
      ETHToNVT: "", // 异构网络币价格兑NVT
      selectHeterogeneousChain: "ETH"
    };
  },

  components: {
    CommonHead,
    TransferConfirm
  },

  watch: {
    "transferModal.network"(val) {
      // this.$refs.transferForm.validateField("to");
      if (this.chain === "NERVE") {
        if (val === "Ethereum" || val === "BSC") {
          // this.showCustomFee();
          this.calculateFee();
        } else {
          this.fee = crossFee;
        }
      } else if (this.chain === "NULS") {
        this.fee = crossFee;
      } else {
        this.eTransfer = new ETransfer({
          chain: this.chain,
          network: this.$store.state.network
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
      return {
        from: superLong(this.transferModal.from, 12),
        to: superLong(this.transferModal.to, 12),
        amount: this.transferModal.amount,
        fee: this.fee,
        remarks: this.transferModal.remarks
      };
    },
  },

  async created() {
    const { address, chain, assetChainId, assetId, contractAddress } = this.$route.query;
    this.chain = chain;
    this.transferModal.from = address;
    this.assetChainId = assetChainId;
    this.assetId = assetId;
    this.contractAddress = contractAddress;
    const feeSymbol = {
      NULS: "NULS",
      NERVE: "NVT",
      Ethereum: "ETH",
      BSC: "BNB"
    };
    this.feeSymbol = feeSymbol[this.chain];
    await this.getAssetsList();
    if (this.chain === "Ethereum" || this.chain === "BSC") {
      this.eTransfer = new ETransfer({
        chain: this.chain,
        network: this.$store.state.network
      });
      console.log(this.$store.state.network, 888,this.chain)
      this.getGasPrice();
    } else {
      const network = this.$store.state.network;
      const config = JSON.parse(sessionStorage.getItem("config"));
      this.MAIN_INFO = config[network][this.chain];
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
        });
        this.assetsList = res.data;
      }
    },
    // 选择资产
    changeType(item) {
      this.chooseAsset = item; //选择的转账资产
      this.validateParameter();
    },
    async getGasPrice() {
      this.feeLoading = true;
      const gasLimit = this.chooseAsset.contractAddress ? "100000" : "33594";
      this.fee = await this.eTransfer.getGasPrice(gasLimit);
      this.feeLoading = false;
    },
    async getSpeedUpFee() {
      this.feeLoading = true;
      const gasLimit = this.chooseAsset.contractAddress ? "100000" : "33594";
      this.fee = await this.eTransfer.getSpeedUpFee(gasLimit);
      this.feeLoading = false;
    },
    // 计算nerve体现到eth bsc手续费
    calculateFee() {
      this.feeLoading = true;
      this.feeLoading = false;
    },
    // 修改提现手续费等级
    feeTypeChange(val) {
      this.withdrawalFee = this.defaultFeeList[val - 1];
    },
    //确定自定义手续费金额
    customFee() {
      this.withdrawalFee = Number(this.ETHToNVT);
      this.feeType = 0;
      this.custom = false;
    },
    // 修改自定义手续费
    customFeeChange(val) {
      console.log(val);
    },
    // ETH BSC 加速
    async changeSpeedUpFee(e) {
      if (e) {
        this.getSpeedUpFee();
      } else {
        this.getGasPrice();
      }
    },
    validateParameter() {
      // 默认普通转账type=2  eth，bsc不涉及type
      this.nulsType = "";
      this.type = 10;
      if (this.chain === "NULS") {
        if (!this.transferModal.to || !this.transferModal.amount) return;
        /* let validParams = false;
        this.$refs.transferForm.validateField(["to", "amount"], valid => {
          if (!valid) {
            validParams = true;
          }
        });
        if (!validParams) return; */
        if (this.chooseAsset.contractAddress) {
          // nuls 合约资产跨链转账
          this.nulsType = "tokenCross";
          this.type = 16;
          this.transferCrossChain();
        } else {
          // nuls 本链资产跨链
        }
      }
    },
    //nuls token交易
    validateContractCallTest() {
      //nuls合约交易
      // 本链token转账
      //transferTransfer()
      // transferInfo.amount = Number(Plus(0, Number(Times(this.transferForm.gas, this.transferForm.price)))).toString();
      // 向合约地址转nuls
      // transferPayable()
      // this.contractCallData.chainId = MAIN_INFO.chainId;
      // transferInfo.value = Number(transferInfo.amount);
      // transferInfo.amount = Number(Plus(transferInfo.fee, Number(Times(this.transferForm.gas, this.transferForm.price)))).toString();
      // transferInfo.amount = Number(Plus(transferInfo.amount, transferInfo.value)).toString();
      // token跨链转账
      // transferCrossChain()
      // 向合约地址转token
      //transferTransfer()
      //transferInfo.amount = Number(Plus(0, Number(Times(this.transferForm.gas, this.transferForm.price)))).toString();
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
      const network = this.$store.state.network;
      let txHex = "";
      if (this.chain === "NULS" || this.chain === "NERVE") {
        const transfer = new NTransfer({
          chain: this.chain,
          network,
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
          /* if (this.nulsType === "nulsToContract") {
            //向合约地址转nuls
            this.contractCallData.chainId = this.MAIN_INFO.chainId;
            transferInfo.value = transferInfo.amount;
            transferInfo.amount = Plus(transferInfo.fee, Times(this.transferModal.gas, this.transferModal.price)).toFixed();
            transferInfo.amount = Plus(transferInfo.amount, transferInfo.value).toFixed();
          } else if (this.nulsType === "tokenTransfer") {
            // token转账 向合约地址转token
            transferInfo.amount = Plus(0, Times(this.transferModal.gas, this.transferModal.price)).toFixed();
          } */
        }
        const inputOuput = await transfer.inputsOrOutputs(transferInfo);
        const txData = this.type === 16 ? this.contractCallData : {};
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
          this.loading = false;
          this.$message({
            type: "error",
            message: e,
            duration: 2000
          });
        }
      } else {
        txHex = await this.eTransfer.getTxHex({
          to: this.transferModal.to,
          value: this.transferModal.amount,
          upSpeed: this.speedUpFee, //是否加速
          contractAddress: "0x2cc112629954377620a20ce4fd730df8d977e6fe", //this.chooseAsset.contractAddress,
          tokenDecimals: 8 //this.chooseAsset.decimals
        });
      }
      console.log(txHex, "====txHex====")
      if (txHex) {
        this.broadcastTx(txHex);
      } else {
        console.error("签名失败");
      }
    },
    //广播交易
    async broadcastTx(txHex) {
      const params = {
        chain: this.chain,
        address: this.transferModal.from,
        txHex
      };
      const res = await this.$request({
        url: "/tx/transfer",
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

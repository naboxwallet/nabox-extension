<template>
  <div class="transfer-page" v-loading="loading">
    <transition name="fade-transform" mode="out-in">
      <div v-show="!showConfirm">
        <common-head>{{ $t("home.home7") }}</common-head>
        <div class="content">
          <el-form
            label-position="top"
            :model="transferModal"
            :rules="transferRules"
            ref="transferForm"
          >
            <el-form-item label="From">
              <el-input disabled :value="superLong(transferModal.from)">
              </el-input>
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
            <el-switch
              v-show="chooseAsset.contractAddress"
              v-model="seniorValue"
              :inactive-text="$t('transfer.transfer9')"
              :width="32"
              class="senior_value fr"
            >
            </el-switch>
            <div v-show="seniorValue" class="senior_list cb">
              <el-form-item label="Gas Limit" prop="gas">
                <el-input v-model="transferModal.gas"></el-input>
              </el-form-item>
              <el-form-item label="Price" prop="price">
                <el-input v-model="transferModal.price"></el-input>
              </el-form-item>
            </div>
            <el-form-item
              :label="$t('public.remark')"
              v-if="chain === 'NULS' || chain === 'NERVE'"
            >
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
              <span v-if="!feeLoading">{{ fee }}{{ feeSymbol }}</span>
              <img v-else src="../../assets/img/loading.svg" />
              <el-checkbox
                v-if="chain === 'Ethereum' || chain === 'BSC'"
                v-model="speedUpFee"
                @change="changeSpeedUpFee"
              >
                {{ $t("transfer.transfer14") }}
              </el-checkbox>
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
import { NTransfer, ETransfer } from "@/utils/api";
export default {
  data() {
    const validateTo = (rule, value, callback) => {
      //console.log(this.changeAssetInfo);
      if (value === "") {
        callback(new Error(this.$t("transfer.transfer1")));
      } else if (this.chain === "Ethereum" || this.chain === "BSC") {
        const correct = validateAddress(value);
        if (correct) {
          callback();
        } else {
          callback(new Error(this.$t("transfer.transfer1")));
        }
      } else if (this.chain === "NERVE" || this.chain === "NULS") {
        console.log(132);
        // this.fee = 0.001;
        const from = nerve.verifyAddress(this.transferModal.from);
        let to = {};
        try {
          to = nerve.verifyAddress(value);
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
    const validateGas = (rule, value, callback) => {
      if (!value) {
        callback(new Error(this.$t("transfer.transfer5")));
      } else if (value < 1 || value > 10000000) {
        callback(new Error(this.$t("transfer.transfer6")));
      } else {
        callback();
      }
    };
    const validatePrice = (rule, value, callback) => {
      if (!value) {
        callback(new Error(this.$t("transfer.transfer7")));
      } else if (value < 1) {
        callback(new Error(this.$t("transfer.transfer8")));
      } else {
        callback();
      }
    };
    return {
      loading: true,
      chain: "",
      transferModal: {
        from: "",
        to: "",
        symbol: "", //交易币的contractAddress 或者chainId-assetId
        amount: "",
        remarks: "",
        gas: 1,
        price: 25,
      },
      transferRules: {
        to: [{ validator: validateTo, trigger: ["blur"] }],
        amount: [{ validator: validateAmount, trigger: ["blur"] }],
        gas: [{ validator: validateGas, trigger: ["blur", "change"] }],
        price: [{ validator: validatePrice, trigger: ["blur", "change"] }]
      },
      fee: 0.001,
      assetsList: [], //资产列表
      chooseAsset: {}, //选择的转账资产
      seniorValue: false, // nuls token转账高级选项
      contractCallData: {}, //合约信息
      showConfirm: false,
      feeSymbol: "", //手续费符号
      speedUpFee: false, // eth bsc加速
      feeLoading: false,
      type: 2, //交易类型
    };
  },

  components: {
    CommonHead,
    TransferConfirm
  },

  watch: {},

  computed: {
    confirmData() {
      return {
        from: superLong(this.transferModal.from, 12),
        to: superLong(this.transferModal.to, 12),
        amount: this.transferModal.amount + " " + this.chooseAsset.symbol,
        fee: this.fee + " " + this.feeSymbol,
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
    const config = JSON.parse(sessionStorage.getItem("config"));
    this.MAIN_INFO = config[this.$store.state.network][this.chain];
    console.log(this.MAIN_INFO, 999)
    const feeSymbol = {
      NULS: "NULS",
      NERVE: "NVT",
      Ethereum: "ETH",
      BSC: "BNB"
    };
    this.feeSymbol = feeSymbol[this.chain];
    this.getAssetsList();
    if (this.chain === "Ethereum" || this.chain === "BSC") {
      this.eTransfer = new ETransfer({
        chain: this.chain,
        network: this.$store.state.network
      });
      console.log(this.$store.state.network, 888,this.chain)
      this.getGasPrice();
    }
    this.loading = false;
  },

  mounted() {},

  methods: {
    getKey(item) {
      return item.contractAddress
        ? item.contractAddress
        : item.chainId + "-" + item.assetId;
    },
    superLong(str, len = 12) {
      return superLong(str, len);
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
      this.chooseAsset = this.assetsList.filter(v => item === v.ids)[0]; //选择的转账资产
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
      this.type = 2;
      if (this.chain === "NULS") {
        if (!this.transferModal.to || !this.transferModal.amount) return;
        if (this.chooseAsset.contractAddress) {
          // nuls 合约资产  普通token转账、向合约地址转token
          this.nulsType = "tokenTransfer";
          this.type = 16;
          this.transferTransfer();
        } else {
          // nuls 本链资产 普通nuls转账 向合约地址转nuls
          this.nulsType = "nulsTransfer";
          const toType = nerve.verifyAddress(this.transferModal.to);
          if (toType.type === 2) {
            //向合约地址转nuls
            this.nulsType = "nulsToContract";
            this.type = 16;
            this.transferPayable();
          } else {
            this.type = 2;
            this.nulsType = "nulsTransfer";
            this.fee = 0.001;
          }
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
    // 合约transfer
    transferTransfer() {
      let gasLimit = sdk.CONTRACT_MAX_GASLIMIT;
      let price = Number(this.transferModal.price);
      let contractAddress = this.chooseAsset.contractAddress;
      let methodName = "transfer";
      let methodDesc = "";
      let args = [this.transferModal.to, timesDecimals(this.transferModal.amount, this.chooseAsset.decimals)];
      this.validateContractCall(this.transferModal.from, 0, gasLimit, price, contractAddress, methodName, methodDesc, args);
    },

    //合约 payable
    transferPayable() {
      let gasLimit = sdk.CONTRACT_MAX_GASLIMIT;
      let price = this.transferModal.price;
      let contractAddress = this.transferModal.to;
      let methodName = "_payable";
      let methodDesc = "";
      let args = [];
      this.validateContractCall(this.transferModal.from, Number(Times(this.transferModal.amount, 100000000)), gasLimit, price, contractAddress, methodName, methodDesc, args);
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
          console.log(this.fee, 1)
          this.fee = Number(Plus(Division(Times(this.transferModal.gas, this.transferModal.price), 10000000), 0.001));
          console.log(this.fee, 2)
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
      this.loading = true;
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
          });
        } catch (e) {
          console.error("签名失败" + e);
          this.loading = false;
          this.$message({
            type: "error",
            message: e,
            duration: 2000
          });
        }
      } else {
        try {
          txHex = await this.eTransfer.getTxHex({
            to: this.transferModal.to,
            value: this.transferModal.amount,
            upSpeed: this.speedUpFee, //是否加速
            contractAddress: this.chooseAsset.contractAddress,
            tokenDecimals: this.chooseAsset.decimals
          });
          console.log(txHex, "====132====")
        } catch (e) {
          console.error("组装交易失败" + e);
          this.loading = false;
          this.$message({
            type: "error",
            message: e,
            duration: 2000
          });
        }
      }
      if (txHex) {
        this.broadcastTx(txHex);
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
      this.loading = false;
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
    },
    async broadcastTx2(hash) {
      if (!hash) return;
      const params = {
        chain: this.chain,
        hash: hash
      };
      const res = await this.$request({
        url: "/tx/transfer/save",
        method: "post",
        data: params
      });
      this.loading = false;
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
    .btn {
      width: 100%;
      margin-top: 20px;
    }
  }
}
</style>

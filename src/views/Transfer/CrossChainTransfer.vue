<template>
  <div class="transfer-page" v-loading="transferLoading">
    <transition name="fade-transform" mode="out-in">
      <div v-show="!showConfirm">
        <common-head>{{ $t("home.home8") }}</common-head>
        <div class="content">
          <el-form label-position="top" :model="transferModal" :rules="transferRules" ref="transferForm">
            <el-form-item label="From">
              <el-input disabled :value="superLong(transferModal.from)">
              </el-input>
            </el-form-item>
            <el-form-item :label="$t('public.network')" prop="network">
              <el-select v-model="transferModal.network">
                <el-option v-for="item in networkList" :label="item" :value="item" :key="item"
                           :disabled="checkDisable(item)">
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="To" prop="to">
              <el-input v-model.trim="transferModal.to">
              </el-input>
            </el-form-item>
            <el-form-item :label="$t('public.symbol')" prop="symbol">
              <el-select v-model="transferModal.symbol" @change="changeType">
                <el-option v-for="item in assetsList" :key="item.ids" :label="item.symbol" :value="item.ids">
                </el-option>
              </el-select>
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
                &nbsp;&nbsp;&nbsp;
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
            <el-button class="btn" type="primary" @click="checkForm('transferForm')">
              {{ $t("public.next") }}
            </el-button>
          </el-form>
        </div>
      </div>
    </transition>
    <transfer-confirm :data="confirmData" :visiable.sync="showConfirm" @confirm="submit">
    </transfer-confirm>
  </div>
</template>

<script>
  import CommonHead from "@/components/CommonHead";
  import TransferConfirm from "@/components/TransferConfirm";
  import {
    superLong,
    timesDecimals,
    Plus,
    Times,
    divisionDecimals,
    getSymbolUSD,
    Minus,
    chainToSymbol
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
          console.log(to)
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
          console.log(to, NERVEChainId, 9988);
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
      const validataSymbol = async (rule, value, callback) => {
        if (this.chain !== "NERVE" && this.chain !== "NULS" && !this.heterogeneousChain_In.heterogeneousChainId) {
          callback(new Error(this.$t("transfer.transfer24") + "NERVE"));
        } else if (this.isWithdrawal && !this.heterogeneousChain_Out.heterogeneousChainId) {
          callback(new Error(this.$t("transfer.transfer24") + this.transferModal.network));
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
          to: [{validator: validateTo, trigger: ["blur"]}],
          network: [{validator: validateNetwork}],
          symbol: [{validator: validataSymbol, trigger: ["change"]}],
          amount: [{validator: validateAmount, trigger: ["blur"]}]
        },
        networkList: ["NULS", "NERVE", "Ethereum", "BSC", "Heco"],
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
        transferLoading: false,
        heterogeneousChain_In: {}, // 跨链转入异构链
        heterogeneousChain_Out: {}, // 跨链转出的异构链
        needAllowance: false, // erc20 资产跨链转入到nerve是否需要授权
        refreshAllowance: true,
      };
    },

    components: {
      CommonHead,
      TransferConfirm
    },

    watch: {
      "transferModal.network"(val) {
        const network = this.$store.state.network;
        if (this.chain === "NERVE") {
          if (val !== "NULS") {
            // this.showCustomFee();
            this.type = 43;
            this.selectHeterogeneousChain = chainToSymbol[val];
            this.eTransfer = new ETransfer({chain: val, network});
            this.getHeterogeneousChain();
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
          this.changeSpeedUpFee(this.speedUpFee);
        }
      },
      chooseAsset: {
        deep: true,
        handler() {
          this.getHeterogeneousChain();
          this.changeSpeedUpFee(this.speedUpFee);
          if (this.isCrossIn) {
            this.getERC20Allowance();
          }
        }
      }
    },

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
      const {address, chain, assetChainId, assetId, contractAddress} = this.$route.query;
      const network = this.$store.state.network;
      const config = JSON.parse(sessionStorage.getItem("config"));
      this.sessionConfig = config[network];
      this.chain = chain;
      this.transferModal.from = address;
      this.assetChainId = assetChainId;
      this.assetId = assetId;
      this.contractAddress = contractAddress;
      this.feeSymbol = chainToSymbol[this.chain];
      if (this.chain !== "NULS" && this.chain !== "NERVE") {
        this.eTransfer = new ETransfer({chain: this.chain, network});
        // this.getGasPrice();
      } else {
        this.MAIN_INFO = this.sessionConfig[this.chain];
        console.log(this.MAIN_INFO, "==MAIN_INFO==")
      }
      await this.getAssetsList();
    },

    mounted() {
    },

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
        return item.contractAddress ? item.contractAddress : item.chainId + "-" + item.assetId;
      },

      async getAssetsList() {
        const params = {chain: this.chain, address: this.transferModal.from};
        const res = await this.$request({url: "/wallet/address/assets", data: params});
        if (res.code === 1000) {
          res.data.map(v => {
            v.balance = divisionDecimals(v.balance, v.decimals);
            v.ids = this.getKey(v);
            if (this.contractAddress && this.contractAddress === v.contractAddress) {
              this.chooseAsset = v;
              this.transferModal.symbol = v.contractAddress;
            } else {
              if (v.chainId === this.assetChainId && v.assetId === this.assetId) {
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
        this.chooseAsset = this.assetsList.filter(v => item === v.ids)[0];
        this.validateParameter();
      },

      // 获取跨链转入、跨链转出的异构链
      getHeterogeneousChain() {
        this.heterogeneousChain_In = {};
        this.heterogeneousChain_Out = {};
        // console.log(this.chooseAsset, 666)
        if (!this.chooseAsset.heterogeneousList) return;
        const heterogeneousChain_In = this.chooseAsset.heterogeneousList.filter(v => v.chainName === this.chain)[0];
        const heterogeneousChain_Out = this.chooseAsset.heterogeneousList.filter(v => v.chainName === this.transferModal.network)[0];
        //console.log(heterogeneousChain_In, "in--out", heterogeneousChain_Out);
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
        const result = await this.eTransfer.calWithdrawalNVTFee(this.nvtUSD, this.heterogeneousChainUSD, this.heterogeneousChain_Out.token);
        const defaultFee = Number(divisionDecimals(result, this.MAIN_INFO.decimal));
        const chooseFee = this.speedUpFee ? defaultFee + 3 : defaultFee;
        this.fee = chooseFee + this.normalFee;
        this.feeLoading = false;
      },

      //默认手续费 --- eth
      async calWithdrawFee() {
        const result = await this.eTransfer.calWithdrawFee(this.heterogeneousChain_Out.token);
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
          if (this.transferModal.network && this.transferModal.network !== "NULS") {
            this.type = 43;
            this.calculateFee();
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
          this.$message({message: res.msg, type: "error", duration: 3000});
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
          this.$message({type: "error", message: res.msg, duration: 3000});
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
            this.$message({type: "error", message: e, duration: 2000});
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
            this.$message({
              type: "error",
              message: e,
              duration: 2000
            });
          }
        }
        console.log(txHex, "====txHex====");
        if (txHex) {
          await this.broadcastTxCross(txHex);
        } else {
          console.error("签名失败");
        }
        this.transferLoading = false;
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
        if (res.code === 1000) {
          this.$message({type: "success", message: this.$t("transfer.transfer13"), duration: 2000});
          setTimeout(() => {
            this.$router.push("/");
          }, 1500);
        } else {
          this.$message({type: "error", message: res.msg, duration: 3000});
        }
      }
    }
  };
</script>
<style lang="less">
</style>

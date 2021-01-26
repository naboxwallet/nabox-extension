<template>
  <div class="inner-transfer transfer-page" v-loading="transferLoading" :element-loading-text="loadingText">
    <transition name="fade-transform" mode="out-in">
      <div v-show="!showConfirm">
        <common-head>
          {{ $t("innerTransfer.innerTransfer1") }}
        </common-head>
        <div class="tips">Tips: {{ $t("innerTransfer.innerTransfer2") }}</div>
        <div class="transfer-wrap">
          <div class="account-select">
            <div class="prefix">
              <span>{{ $t("innerTransfer.innerTransfer3") }}</span>
              <img src="../../assets/img/split-line.png" alt=""/>
              <span>{{ $t("innerTransfer.innerTransfer4") }}</span>
            </div>
            <div class="account-content">
              <div class="from">
                <el-select v-model="fromNetwork">
                  <el-option v-for="item in networkList" :key="item.network" :label="item.network"
                             :value="item.network">
                  </el-option>
                </el-select>
                <span class="address">{{ superLong(fromAddress) }}</span>
              </div>
              <div class="to">
                <el-select v-model="toNetwork">
                  <el-option v-for="item in networkList" :key="item.network" :label="item.network" :value="item.network"
                             :disabled="item.disabled">
                  </el-option>
                </el-select>
                <span class="address">{{ superLong(toAddress) }}</span>
              </div>
            </div>
          </div>
          <el-form label-position="top" :model="transferModal" :rules="transferRules" ref="transferForm">
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
                <!-- <el-button slot="append">
                  {{ $t("public.all") }}
                </el-button> -->
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
              <!-- eth 《----》 bnb -->
              <template v-if="isWithdrawal && isCrossIn">
                <span v-if="!feeLoading">
                  {{ fee }}{{ chainToSymbol[fromNetwork] }} + {{ extraFee }}
                  {{ chainToSymbol.NERVE }}
                </span>
                <img v-else src="../../assets/img/loading.svg"/>
                <el-checkbox v-model="speedUpFee" @change="changeSpeedUpFee">
                  {{ $t("transfer.transfer14") }}
                </el-checkbox>
              </template>
              <!-- eth/bnb ==》nerve -->
              <template v-else-if="isWithdrawal">
                <span v-if="!feeLoading">
                  {{ fee }} {{ chainToSymbol[fromNetwork] }}
                  <!-- eth/bnb ==》nuls -->
                  <span v-if="extraFee">
                    + {{ extraFee }}{{ chainToSymbol.NERVE }}
                  </span>
                </span>
                <img v-else src="../../assets/img/loading.svg"/>
                <el-checkbox v-model="speedUpFee" @change="changeSpeedUpFee">
                  {{ $t("transfer.transfer14") }}
                </el-checkbox>
              </template>
              <!-- eth/bnb ==》 nerve -->
              <template v-else-if="isCrossIn">
                <span v-if="!feeLoading">
                  {{ fee }}{{ chainToSymbol[fromNetwork] }}
                  <!-- eth/bnb ==》 nerve -->
                  <span v-if="toNetwork === 'NULS'">
                    + {{ extraFee }} {{ chainToSymbol.NERVE }} + {{ extraFee }}
                    {{ chainToSymbol.NULS }}
                  </span>
                </span>
                <img v-else src="../../assets/img/loading.svg"/>
                <el-checkbox v-model="speedUpFee" @change="changeSpeedUpFee">
                  {{ $t("transfer.transfer14") }}
                </el-checkbox>
              </template>
              <template v-else>
                <span v-if="toNetwork === 'NULS'">
                  {{ fee }} {{ chainToSymbol.NERVE }} + {{ extraFee }}
                  {{ chainToSymbol.NULS }}
                </span>
                <span v-else>
                  {{ fee }}
                  {{ chainToSymbol.NULS }}
                </span>
              </template>
            </div>
            <el-button class="btn" type="primary" @click="checkForm('transferForm')" :disabled="disabledBtn">
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
    divisionDecimals,
    timesDecimals,
    Plus,
    getSymbolUSD,
    Minus,
    checkBalance,
    chainToSymbol,
    Times
  } from "@/utils/util";
  import {NTransfer, ETransfer, crossFee} from "@/utils/api";
  import {getContractCallData} from "@/utils/nulsContractValidate";

  export default {
    data() {
      const validataSymbol = async (rule, value, callback) => {
        if (this.isCrossIn && !this.heterogeneousChain_In.heterogeneousChainId) {
          callback(new Error(this.$t("transfer.transfer24") + "NERVE"));
        } else if (
          this.isWithdrawal &&
          !this.heterogeneousChain_Out.heterogeneousChainId
        ) {
          callback(new Error(this.$t("transfer.transfer24") + this.toNetwork));
        } else {
          callback();
        }
      };
      const validateAmount = async (rule, value, callback) => {
        const decimals = this.chooseAsset.decimals || 8;
        const patrn = new RegExp(
          "^([1-9][\\d]{0,20}|0)(\\.[\\d]{0," + decimals + "})?$"
        );
        if (value === "") {
          callback(new Error(this.$t("transfer.transfer2")));
        } else if (!patrn.exec(value)) {
          callback(new Error(this.$t("transfer.transfer3") + ": " + decimals));
        } else if (value - this.chooseAsset.balance > 0) {
          callback(
            new Error(
              this.$t("transfer.transfer4") + ": " + this.chooseAsset.balance
            )
          );
        } else {
          if (this.fromNetwork === "NULS") {
            await this.validateParameter();
          }
          callback();
        }
      };
      this.normalFee = 0.001;
      this.chainToSymbol = chainToSymbol;
      return {
        account: {},
        networkList: [],
        fromNetwork: "NULS",
        fromAddress: "",
        toNetwork: "NERVE",
        toAddress: "",
        assetsList: [], //资产列表
        chooseAsset: {}, //选择的转账资产
        transferModal: {
          symbol: "",
          amount: "",
          remarks: "",
          gas: 1,
          price: 25
        },
        transferRules: {
          symbol: [{validator: validataSymbol, trigger: ["change"]}],
          amount: [{validator: validateAmount, trigger: ["blur", "change"]}]
        },
        fee: "",
        extraFee: "", //跨链非本链手续费
        showConfirm: false,
        transferLoading: false,
        loadingText: '',//加载信息
        speedUpFee: false, // eth bsc加速
        withdrawalFeeLoading: false,
        crossInFeeLoading: false,
        custom: false, // nerve提现到eth bsc是否自定义手续费
        feeType: 2, //手续费等级 1：慢，2：中，3：快
        withdrawalFeeForETH: "", //提现手续费兑eth
        ETHToNVT: "", // 异构网络币价格兑NVT
        selectHeterogeneousChain: "ETH",
        type: 10, //nerve nuls 交易类型
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
      fromNetwork: {
        immediate: true,
        async handler(val, old) {
          if (val === this.toNetwork) {
            this.toNetwork = old;
          }
          const account = {...this.$store.getters.currentAccount[this.network]};
          this.fromAddress = account[val];
          try {
            await this.getAssetsList();
            this.checkCanCross();
            this.calTransferFee();
          } catch (e) {
            console.log(e)
          }
        }
      },
      toNetwork: {
        immediate: true,
        handler(val, old) {
          if (val === this.fromNetwork) {
            this.fromNetwork = old;
          }
          this.selectHeterogeneousChain = this.chainToSymbol[val];
          const account = {...this.$store.getters.currentAccount[this.network]};
          this.toAddress = account[val];
          this.calTransferFee();
          this.getHeterogeneousChain();
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

      feeLoading() {
        return this.withdrawalFeeLoading || this.crossInFeeLoading;
      },

      // 是否是提现到eth、bnb
      isWithdrawal() {
        const NerveNuls = net => {
          return ["NULS", "NERVE"].indexOf(net) > -1;
        };
        return (
          (this.fromNetwork === "NULS" && this.toNetwork !== "NERVE") ||
          (this.fromNetwork === "NERVE" && this.toNetwork !== "NULS") ||
          (!NerveNuls(this.fromNetwork) && !NerveNuls(this.toNetwork))
        );
      },

      // 是否是eth 、bnb跨链到nerve、nuls
      isCrossIn() {
        return this.fromNetwork !== "NULS" && this.fromNetwork !== "NERVE";
      },

      confirmData() {
        let fee = "";
        if (this.isWithdrawal && this.isCrossIn) {
          fee =
            this.fee +
            this.chainToSymbol[this.fromNetwork] +
            "+" +
            this.extraFee +
            this.chainToSymbol.NERVE;
        } else if (this.isWithdrawal) {
          if (this.extraFee) {
            fee =
              this.fee +
              this.chainToSymbol[this.fromNetwork] +
              "+" +
              this.extraFee +
              this.chainToSymbol.NERVE;
          } else {
            fee = this.fee + this.chainToSymbol[this.fromNetwork]
          }
        } else if (this.isCrossIn) {
          if (this.toNetwork === "NULS") {
            fee =
              this.fee +
              this.chainToSymbol[this.fromNetwork] +
              "+" +
              this.extraFee +
              this.chainToSymbol.NERVE +
              "+" +
              this.extraFee +
              this.chainToSymbol.NULS;
          } else {
            fee = this.fee + this.chainToSymbol[this.fromNetwork]
          }
        } else {
          if (this.extraFee) {
            fee =
              this.fee +
              this.chainToSymbol.NERVE +
              "+" +
              this.extraFee +
              this.chainToSymbol.NULS;
          } else {
            fee = this.fee + this.chainToSymbol.NULS;
          }
        }
        return {
          from: superLong(this.fromAddress, 12),
          to: superLong(this.toAddress, 12),
          amount: this.transferModal.amount,
          assetSymbol: this.chooseAsset.symbol,
          fee,
          remarks: this.transferModal.remarks
        };
      },

      network() {
        return this.$store.state.network;
      },

      disabledBtn() {
        if (this.feeLoading || this.needAllowance) {
          return true;
        }
        return false;
      }
    },

    created() {
    },

    mounted() {
      this.account = {...this.$store.getters.currentAccount[this.network]};
      const account = {...this.$store.getters.currentAccount[this.network]};
      const sortOrder = ["NULS", "NERVE", "Ethereum", "BSC", "Heco"];

      function indexOf(item) {
        return sortOrder.indexOf(item);
      }

      const networks = Object.keys(account).sort((a, b) => {
        return indexOf(a) - indexOf(b);
      });
      this.networkList = networks.map(n => ({
        network: n,
        disabled: false
      }));
    },

    methods: {

      getKey(item) {
        return item.contractAddress
          ? item.contractAddress
          : item.chainId + "-" + item.assetId;
      },

      // 查询from网络资产列表
      async getAssetsList() {
        const params = {
          chain: this.fromNetwork,
          address: this.fromAddress
        };
        const res = await this.$request({
          url: "/wallet/address/assets",
          data: params
        });
        if (res.code === 1000) {
          res.data.map(v => {
            v.balance = divisionDecimals(v.balance, v.decimals);
            v.ids = this.getKey(v);
            /* if (v.heterogeneousList && v.heterogeneousList.length) {
              const symbolToChain = {
                ETH: "Ethereum",
                BNB: "BSC",
                HT: "Heco"
              };
              v.heterogeneousList.map(item => {
                item.network = symbolToChain[item];
              });
            } */
          });
          const defaultAsset = res.data[0];
          this.chooseAsset = defaultAsset;
          this.transferModal.symbol = defaultAsset.contractAddress
            ? defaultAsset.contractAddress
            : defaultAsset.chainId + "-" + defaultAsset.assetId;
          this.assetsList = res.data;
        }
      },

      // 计算跨链手续费
      calTransferFee() {
        /* this.isWithdrawal = false;
        this.isCrossIn = false; */
        this.fee = "";
        this.extraFee = "";
        const fromNetwork = this.fromNetwork;
        const toNetwork = this.toNetwork;
        // this.getHeterogeneousChain();
        const withdrawal = () => {
          // this.isWithdrawal = true;
          this.calculateFee();
          this.withdrawalTransfer = new ETransfer({
            chain: this.toNetwork,
            network: this.$store.state.network
          });
        };
        if (fromNetwork === "NULS") {
          this.fee = crossFee;
          if (toNetwork !== "NERVE") {
            withdrawal();
          }
        } else if (fromNetwork === "NERVE") {
          if (toNetwork === "NULS") {
            this.fee = crossFee;
            this.extraFee = crossFee;
          } else {
            withdrawal();
          }
        } else {
          // this.isCrossIn = true;
          this.crossInTransfer = new ETransfer({
            chain: this.fromNetwork,
            network: this.$store.state.network
          });
          this.getGasPrice();
          if (toNetwork === "NULS") {
            this.extraFee = crossFee;
          } else if (toNetwork !== "NERVE") {
            withdrawal();
          }
        }
      },

      // 获取跨链转入、跨链转出的异构链
      getHeterogeneousChain() {
        this.heterogeneousChain_In = {};
        this.heterogeneousChain_Out = {};
        if (!this.chooseAsset.heterogeneousList) return;
        const heterogeneousChain_In = this.chooseAsset.heterogeneousList.filter(
          v => v.chainName === this.fromNetwork
        )[0];
        const heterogeneousChain_Out = this.chooseAsset.heterogeneousList.filter(
          v => v.chainName === this.toNetwork
        )[0];
        console.log(heterogeneousChain_In, "in--out", heterogeneousChain_Out);
        this.heterogeneousChain_In = heterogeneousChain_In || {};
        this.heterogeneousChain_Out = heterogeneousChain_Out || {};
      },

      getMainInfo(chain) {
        const network = this.$store.state.network;
        const config = JSON.parse(sessionStorage.getItem("config"));
        return config[network][chain];
      },

      // 充值、提现加速
      async changeSpeedUpFee(e) {
        if (this.isWithdrawal) {
          //计算提现手续费
          this.calculateFee();
        }
        if (this.isCrossIn) {
          // 计算充值手续费
          if (e) {
            this.getSpeedUpFee();
          } else {
            this.getGasPrice();
          }
        }
      },

      // 计算eth bnb跨链转账手续费
      async getGasPrice() {
        this.crossInFeeLoading = true;
        const gasLimit = this.chooseAsset.contractAddress ? "100000" : "33594";
        this.fee = await this.crossInTransfer.getGasPrice(gasLimit);
        if (this.toNetwork !== "NERVE" && this.toNetwork !== "NULS") {
          this.extraFee = this.defaultWithdrawalFee;
        }
        this.crossInFeeLoading = false;
      },

      // 计算eth bnb加速跨链转账手续费
      async getSpeedUpFee() {
        this.crossInFeeLoading = true;
        const gasLimit = this.chooseAsset.contractAddress ? "100000" : "33594";
        this.fee = await this.crossInTransfer.getSpeedUpFee(gasLimit);
        if (this.toNetwork !== "NERVE" && this.toNetwork !== "NULS") {
          this.extraFee = this.defaultWithdrawalFee;
        }
        this.crossInFeeLoading = false;
      },

      //查询erc20资产授权额度
      async getERC20Allowance() {
        const {
          contractAddress,
          heterogeneousChainMultySignAddress,
          token
        } = this.heterogeneousChain_In;
        console.log(this.heterogeneousChain_In, "异构转入链info");
        this.refreshAllowance = true;
        this.needAllowance = false;
        if (token) {
          this.needAllowance = await this.crossInTransfer.getERC20Allowance(
            contractAddress,
            heterogeneousChainMultySignAddress,
            this.fromAddress
          );
        }
        this.refreshAllowance = false;
      },

      // 计算nerve提现到eth bsc手续费
      async calculateFee() {
        this.withdrawalFeeLoading = true;
        const nvtUSD = await getSymbolUSD("NERVE");
        this.nvtUSD = nvtUSD + "";
        const heterogeneousChainUSD = await getSymbolUSD(this.toNetwork);
        //异构链usd价格
        this.heterogeneousChainUSD = heterogeneousChainUSD + "";
        this.calWithdrawalNVTFee();
        // this.calWithdrawFee();
      },

      //获取默认手续费 -nvt
      async calWithdrawalNVTFee() {
        console.log(this.heterogeneousChain_Out, 6566);
        const result = await this.withdrawalTransfer.calWithdrawalNVTFee(
          this.nvtUSD,
          this.heterogeneousChainUSD,
          this.heterogeneousChain_Out.token
        );
        const MAIN_INFO = this.getMainInfo("NERVE");
        const defaultFee = Number(divisionDecimals(result, MAIN_INFO.decimal));
        // const slow = defaultFee - 3 < 1 ? 1 : defaultFee - 3;
        const chooseFee = this.speedUpFee ? defaultFee + 3 : defaultFee;
        const fee = chooseFee + this.normalFee;
        this.defaultWithdrawalFee = fee;
        if (this.fromNetwork === "NULS" || this.isCrossIn) {
          this.extraFee = fee;
        } else {
          this.fee = fee;
        }
        // this.defaultFeeList = [slow, defaultFee, fast];
        this.withdrawalFeeLoading = false;
      },

      //默认手续费 --- eth
      async calWithdrawFee() {
        const result = await this.withdrawalTransfer.calWithdrawFee(this.heterogeneousChain_Out.token);
        this.withdrawalFeeForETH = result;
        this.customFeeChange(result);
      },

      // 修改提现手续费等级
      feeTypeChange(val) {
        const fee = this.defaultFeeList[val - 1] + this.normalFee;
        if (this.fromNetwork === "NULS") {
          this.extraFee = fee;
        } else {
          this.fee = fee;
        }
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
            const tonvt = this.withdrawalTransfer.calNvtByEth(this.nvtUSD, val, this.heterogeneousChainUSD);
            const MAIN_INFO = this.getMainInfo("NERVE");
            this.ETHToNVT = divisionDecimals(tonvt, MAIN_INFO.decimal);
          } else {
            this.ETHToNVT = 0;
          }
        }
      },

      // 选择资产
      changeType(item) {
        this.chooseAsset = this.assetsList.filter(v => item === v.ids)[0]; //选择的转账资产
        // this.checkCanCross();
        this.validateParameter();
      },

      checkCanCross() {
        const networkList = [...this.networkList];
        networkList.map(v => (v.disabled = false));
        if (this.fromNetwork === "NULS" && this.toNetwork !== "NERVE") {
          if (!this.chooseAsset.heterogeneousList) {
            this.toNetwork = "NERVE";
          } else {
            const heterogeneousChain = this.chooseAsset.heterogeneousList.map(
              v => v.chainName
            );
            heterogeneousChain.push("NULS", "NERVE");
            networkList.map(n => {
              n.disabled = heterogeneousChain.indexOf(n.network) === -1;
            });
          }
        }
        this.networkList = networkList;
      },

      async validateParameter() {
        // 默认跨链转账type=10  eth，bsc不涉及type
        this.type = 10;
        const fromNetwork = this.fromNetwork;
        const toNetwork = this.toNetwork;
        const currentAccount = this.$store.getters.currentAccount[
          this.$store.state.network
          ];
        if (fromNetwork === "NULS") {
          if (!this.transferModal.amount) return;
          if (this.chooseAsset.contractAddress) {
            // nuls 合约资产跨链转账
            this.type = 16;
            const NERVEAddress = currentAccount.NERVE;
            const res = await getContractCallData(
              this.fromAddress,
              NERVEAddress,
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
              this.$message({
                message: res.msg,
                type: "error",
                duration: 3000
              });
            }
          } else {
            // nuls 本链资产跨链
          }
        } else if (fromNetwork === "NERVE") {
          if (toNetwork !== "NULS") {
            this.type = 43;
            this.calculateFee();
          }
        }
      },

      superLong(str, len = 8) {
        return superLong(str, len);
      },

      async approveERC20() {
        const {
          contractAddress,
          heterogeneousChainMultySignAddress
        } = this.heterogeneousChain_In;
        const hex = await this.crossInTransfer.getApproveERC20Hex(
          contractAddress,
          heterogeneousChainMultySignAddress,
          this.fromAddress
        );
        console.log(hex, "授权hex");
        if (hex) {
          this.authorCross(hex);
        }
      },
      // 广播授权交易
      async authorCross(txHex) {
        const res = await this.$request({
          url: "/tx/cross/transfer",
          data: {
            chain: this.chain,
            txHex
          }
        });
        if (res.code === 1000) {
          this.$message({
            type: "success",
            message: this.$t("transfer.transfer25"),
            duration: 2000
          });
        } else {
          this.$message({
            type: "error",
            message: res.msg,
            duration: 3000
          });
        }
      },

      checkForm(formName) {
        this.$refs[formName].validate(async valid => {
          if (valid) {
            this.transferLoading = true;
            this.loadingText = '交易组装中...';
            console.log(this.confirmData.fee);
            const enoughFee = await checkBalance(this.confirmData.fee);
            console.log(enoughFee);
            if (enoughFee) {
              this.transferLoading = false;
              this.showConfirm = true;
            } else {
              this.transferLoading = false;
              this.$message({
                type: "warning",
                message: this.$t("transfer.transfer21"),
                duration: 2000
              });
              return false;
            }
          } else {
            return false;
          }
        });
      },

      async submit() {
        this.transferLoading = true;
        this.loadingText = '交易广播中...';
        const fromNetwork = this.fromNetwork;
        const toNetwork = this.toNetwork;
        let hex1 = "", hex2 = "";
        try {
          console.log(fromNetwork, toNetwork);
          if (fromNetwork === "NULS") {
            hex1 = await this.getNerveNulsHex("NULS"); // nuls 跨到nerve hex
            hex1 = hex1.data ? hex1.data : '';
            if (toNetwork !== "NERVE") {
              hex2 = await this.getWithdrawalHex("NERVE"); // nerve提现到eth，bnb hex
            }
          } else if (fromNetwork === "NERVE") {
            if (toNetwork === "NULS") {
              hex1 = await this.getNerveNulsHex("NERVE");
              if (hex1.data && !hex1.success) {
                this.$message({
                  message: '获取该账户资产失败!(chainId:' + hex1.data.assetsChainId + ' assetsId:' + hex1.data.assetsId + ')',
                  type: "error",
                  duration: 3000
                });
                this.transferLoading = false;
                return;
              }
              hex1 = hex1.data;
            } else {
              hex1 = await this.getWithdrawalHex();
            }
          } else {
            hex1 = await this.getCrossInHex(); // eht、bnb跨链到nerve hex
            if (toNetwork === "NULS") {
              hex2 = await this.getNerveNulsHex("NERVE");
              hex2 = hex2.data ? hex2.data : '';
            } else if (toNetwork !== "NERVE") {
              hex2 = await this.getWithdrawalHex();
            }
          }
          console.log(hex1, "===---===", hex2);
          if (hex1) {
            await this.broadcastTxCross(hex1, hex2);
          } else {
            console.error("签名失败");
          }
        } catch (e) {
          console.error("跨链交易签名失败" + e);
          this.$message({type: "error", message: e, duration: 2000});
        }
        this.transferLoading = false;
      },

      async getNerveNulsHex(chain) {
        const network = this.$store.state.network;
        const MAIN_INFO = this.getMainInfo(chain);
        const currentAccount = this.$store.getters.currentAccount[network];
        const to = chain === "NULS" ? "NERVE" : "NULS";
        const type = chain === "NERVE" ? 10 : this.chooseAsset.contractAddress ? 16 : 10;
        const transfer = new NTransfer({chain, network, type});
        const transferInfo = {
          from: currentAccount[chain],
          to: currentAccount[to],
          assetsChainId: this.chooseAsset.chainId,
          assetsId: this.chooseAsset.assetId,
          amount: timesDecimals(this.transferModal.amount, this.chooseAsset.decimals),
          fee: timesDecimals(this.fee, MAIN_INFO.decimal)
        };
        let txData = {};
        if (type === 16) {
          //nuls 合约token跨链
          transferInfo.assetsChainId = MAIN_INFO.chainId;
          transferInfo.assetsId = MAIN_INFO.assetId;
          transferInfo.amount = Plus(20000000, Times(this.transferModal.gas, this.transferModal.price)).toFixed();
          transferInfo.toContractValue = 10000000;
          transferInfo.to = this.chooseAsset.contractAddress;
          txData = this.contractCallData;
        }
        const inputOuput = await transfer.inputsOrOutputs(transferInfo);
        if (inputOuput.data && !inputOuput.success) {
          return {success: false, data: inputOuput.data};
        }
        let resData = await transfer.getTxHex({
          inputs: inputOuput.inputs,
          outputs: inputOuput.outputs,
          remarks: this.transferModal.remarks,
          txData
        });

        return {success: true, data: resData}
      },

      async getWithdrawalHex() {
        const network = this.$store.state.network;
        const transfer = new NTransfer({chain: "NERVE", network, type: 43});
        const MAIN_INFO = this.getMainInfo("NERVE");
        const currentAccount = this.$store.getters.currentAccount[network];
        const assetInfo = this.chooseAsset.contractAddress
          ? {fromChain: this.fromNetwork, contractAddress: this.chooseAsset.contractAddress}
          : {assetsChainId: this.chooseAsset.chainId, assetsId: this.chooseAsset.assetId};
        const transferInfo = {
          from: currentAccount.NERVE,
          amount: timesDecimals(this.transferModal.amount, this.chooseAsset.decimals),
          proposalPrice: timesDecimals(Minus(this.defaultWithdrawalFee, this.normalFee), MAIN_INFO.decimal),
          fee: timesDecimals(this.normalFee, MAIN_INFO.decimal),
          ...assetInfo
        };
        const inputOuput = await transfer.inputsOrOutputs(transferInfo);
        const txData = {
          heterogeneousAddress: this.toAddress,
          heterogeneousChainId: this.heterogeneousChain_Out.heterogeneousChainId
        };
        return await transfer.getTxHex({
          inputs: inputOuput.inputs,
          outputs: inputOuput.outputs,
          remarks: this.transferModal.remarks,
          txData
        });
      },

      async getCrossInHex() {
        // console.log(this.chooseAsset, 555)
        console.log(this.heterogeneousChain_In, "this.heterogeneousChain_In");
        // const to = this.toNetwork === "NERVE" ? this.to
        const currentAccount = this.$store.getters.currentAccount[this.$store.state.network];
        const to = this.toNetwork === "NERVE" ? this.toAddress : currentAccount.NERVE;
        return await this.crossInTransfer.getCrossInTxHex({
          from: this.fromAddress,
          to,
          value: this.transferModal.amount,
          upSpeed: this.speedUpFee, //是否加速
          multySignAddress: this.heterogeneousChain_In.heterogeneousChainMultySignAddress,
          contractAddress: this.heterogeneousChain_In.contractAddress,
          tokenDecimals: this.chooseAsset.decimals
        });
      },

      async broadcastTxCross(hex1, hex2) {
        const assetInfo = this.chooseAsset.contractAddress
          ? {contractAddress: this.chooseAsset.contractAddress}
          : {chainId: this.chooseAsset.chainId, assetId: this.chooseAsset.assetId};
        const params = {
          fromChain: this.fromNetwork,
          toChain: this.toNetwork,
          fromAddress: this.fromAddress,
          toAddress: this.toAddress,
          txHex: hex1,
          ...assetInfo
        };
        if (hex2) {
          params.crossTxHex = hex2;
        }
        console.log(params);
        const res = await this.$request({url: "/tx/cross/transfer", method: "post", data: params});
        console.log(res);
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
  .inner-transfer {
    .tips {
      padding: 15px 25px;
      color: #c38455;
      background-color: #fff3e0;
      margin-bottom: 15px;
    }
    .transfer-wrap {
      padding: 0 25px;
      .account-select {
        padding: 15px;
        margin-bottom: 10px;
        border-radius: 10px;
        border: 1px solid #e9ebf3;
        display: flex;
        .prefix {
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          align-items: center;
          margin-right: 14px;
          img {
            height: 20px;
          }
        }
        .account-content {
          flex: 1;
        }
        .el-select {
          width: 100%;
          z-index: 2;
          .el-input__inner {
            background: transparent;
            border: none;
            height: auto;
            line-height: initial;
            padding: 0;
            font-size: 12px;
          }
          .el-input__suffix {
            right: -5px;
            .el-input__icon {
              line-height: initial;
              font-size: 16px;
              font-weight: 600;
            }
          }
        }
        .from {
          padding-bottom: 12px;
        }
        .to {
          border-top: 1px solid #e9ebf3;
          padding-top: 12px;
        }
        .from,
        .to {
          position: relative;
          span.address {
            position: absolute;
            right: 25px;
            font-size: 14px;
            color: #53b8a9;
          }
        }
      }
    }
  }
</style>

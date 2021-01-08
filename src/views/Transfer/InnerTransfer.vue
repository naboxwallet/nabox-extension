<template>
  <div class="inner-transfer" v-loading="transferLoading">
    <transition name="fade-transform" mode="out-in">
      <div v-show="!showConfirm">
        <common-head>
          {{ $t("innerTransfer.innerTransfer1") }}
          <template v-slot:right>
            <i class="el-icon-document" v-show="false"></i>
          </template>
        </common-head>
        <div class="tips">Tips: {{ $t("innerTransfer.innerTransfer2") }}</div>
        <div class="transfer-wrap">
          <div class="account-select">
            <div class="prefix">
              <span>{{ $t("innerTransfer.innerTransfer3") }}</span>
              <img src="../../assets/img/split-line.png" alt="" />
              <span>{{ $t("innerTransfer.innerTransfer4") }}</span>
            </div>
            <div class="content">
              <div class="from">
                <el-select v-model="fromNetwork">
                  <el-option
                    v-for="item in networkList"
                    :key="item.network"
                    :label="item.network"
                    :value="item.network"
                  ></el-option>
                </el-select>
                <span class="address">{{ superLong(fromAddress) }}</span>
              </div>
              <div class="to">
                <el-select v-model="toNetwork">
                  <el-option
                    v-for="item in networkList"
                    :key="item.network"
                    :label="item.network"
                    :value="item.network"
                    :disabled="item.disabled"
                  ></el-option>
                </el-select>
                <span class="address">{{ superLong(toAddress) }}</span>
              </div>
            </div>
          </div>
          <el-form
            label-position="top"
            :model="transferModal"
            :rules="transferRules"
            ref="transferForm"
          >
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
              <p class="fee-label">{{ $t("public.fee") }}</p>
              <!-- eth 《----》 bnb -->
              <template v-if="isWithdrawal && isCrossIn">
                <span v-if="!feeLoading">
                  {{ fee }}{{ chainToSymbol[fromNetwork] }} + {{ extraFee }}
                  {{ chainToSymbol.NERVE }}
                </span>
                <img v-else src="../../assets/img/loading.svg" />
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
                <img v-else src="../../assets/img/loading.svg" />
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
                <img v-else src="../../assets/img/loading.svg" />
                <el-checkbox v-model="speedUpFee" @change="changeSpeedUpFee">
                  {{ $t("transfer.transfer14") }}
                </el-checkbox>
              </template>
              <template v-else>
                <span v-if="extraFee">
                  {{ fee }} {{ chainToSymbol.NERVE }} + {{ extraFee }}
                  {{ chainToSymbol.NULS }}
                </span>
                <span v-else>
                  {{ fee }}
                  {{ chainToSymbol.NULS }}
                </span>
              </template>
              <!-- <template v-if="isWithdrawal">
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
                    <el-button type="text" @click="custom = true">{{ $t("transfer.transfer20") }}</el-button>
                    <p class="fee-number">
                      {{ fee }} {{ chainToSymbol[fromNetwork] }}
                      <span v-if="extraFee">
                        + {{ extraFee }}{{ chainToSymbol.NERVE }}
                      </span>
                    </p>
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
                    ≈ <span>{{ ETHToNVT }}{{chainToSymbol.NERVE}}</span>
                  </span>
                  <el-button
                    class="cancel-btn"
                    type="text"
                    @click="custom = false"
                  >
                    {{ $t("public.cancel") }}
                  </el-button>
                  <el-button type="text" @click="customFee">
                    {{ $t("public.confirm") }}
                  </el-button>
                </template>
              </template>
              <template v-if="isCrossIn">
                <span v-if="!feeLoading">
                  {{ fee }}{{ chainToSymbol[fromNetwork] }}
                  <span v-if="toNetwork === 'NULS'">
                    + {{ extraFee }} {{ chainToSymbol.NERVE }} + {{ extraFee }}
                    {{ chainToSymbol.NULS }}
                  </span>
                </span>
                <img v-else src="../../assets/img/loading.svg" />
                <el-checkbox v-model="speedUpFee" @change="changeSpeedUpFee">
                  {{ $t("transfer.transfer14") }}
                </el-checkbox>
              </template>
              <template v-else>
                <span v-if="extraFee">
                  {{ fee }} {{ chainToSymbol.NERVE }} + {{ extraFee }}
                  {{ chainToSymbol.NULS }}
                </span>
                <span v-else>
                  {{ fee }}
                  {{ chainToSymbol.NULS }}
                </span>
              </template> -->
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
import { superLong, divisionDecimals, timesDecimals, Plus, getSymbolUSD, Minus, checkBalance } from "@/utils/util";
import { NTransfer, ETransfer, crossFee } from "@/utils/api";
import { getContractCallData } from "@/utils/nulsContractValidate";
export default {
  data() {
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
    this.chainToSymbol = {
      Ethereum: "ETH",
      BSC: "BNB",
      NERVE: "NVT",
      NULS: "NULS"
    };
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
        amount: [{ validator: validateAmount, trigger: ["blur", "change"] }]
      },
      fee: "",
      extraFee: "", //跨链非本链手续费
      showConfirm: false,
      transferLoading: false,
      speedUpFee: false, // eth bsc加速
      feeLoading: true,
      custom: false, // nerve提现到eth bsc是否自定义手续费
      feeType: 2, //手续费等级 1：慢，2：中，3：快
      withdrawalFeeForETH: "", //提现手续费兑eth
      ETHToNVT: "", // 异构网络币价格兑NVT
      selectHeterogeneousChain: "ETH",
      type: 10, //nerve nuls 交易类型
      heterogeneousChain: {}, // 跨链转入、转出选中的异构链
      isWithdrawal: false, // 是否是提现到eth、bnb
      isCrossIn: false, // 是否是eth 、bnb跨链到nerve、nuls
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
        const account = { ...this.$store.getters.currentAccount[this.network] };
        this.fromAddress = account[val];
        try {
          await this.getAssetsList();
          this.checkCanCross();
          this.calTransferFee();
        } catch (e) {}
      }
    },
    toNetwork: {
      immediate: true,
      handler(val, old) {
        if (val === this.fromNetwork) {
          this.fromNetwork = old;
        }
        this.selectHeterogeneousChain = this.chainToSymbol[val];
        const account = { ...this.$store.getters.currentAccount[this.network] };
        this.toAddress = account[val];
        this.calTransferFee();
      }
    }
  },

  computed: {
    confirmData() {
      let fee = "";
      const nerveToNulsFee = crossFee + "NERVE" + "+" + crossFee + "NULS";
      if (this.isWithdrawal) {
        const normalFee = this.fee + this.chainToSymbol[this.fromNetwork];
        fee = this.extraFee
          ? normalFee + "+" + this.extraFee + this.chainToSymbol.NERVE
          : normalFee;
      } else if (this.isCrossIn) {
        const crossInFee = this.fee + this.chainToSymbol[this.fromNetwork]
        fee =
          this.toNetwork === "NULS"
            ? crossInFee + "+" + nerveToNulsFee
            : crossInFee;
      } else {
        fee = this.toNetwork === "NULS" ? nerveToNulsFee : crossFee + "NULS";
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
    }
  },

  created() {},

  mounted() {
    this.account = { ...this.$store.getters.currentAccount[this.network] };
    const account = { ...this.$store.getters.currentAccount[this.network] };
    const sortOrder = ["NULS", "NERVE", "Ethereum", "BSC"];
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
          if (v.heterogeneousList && v.heterogeneousList.length) {
            const symbolToChain = {
              ETH: "Ethereum",
              BNB: "BSC",
              HT: "Heco"
            };
            v.heterogeneousList.map(item => {
              item.network = symbolToChain[item];
            });
          }
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
      this.isWithdrawal = false;
      this.isCrossIn = false;
      this.fee = "";
      this.extraFee = "";
      const fromNetwork = this.fromNetwork;
      const toNetwork = this.toNetwork;
      this.getHeterogeneousChain();
      const withdrawal = () => {
        this.isWithdrawal = true;
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
        this.isCrossIn = true;
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
      if (!this.chooseAsset.heterogeneousList) return;
      const heterogeneousChain = this.chooseAsset.heterogeneousList.filter(
        v => v.chainName === this.toNetwork
      )[0];
      this.heterogeneousChain = heterogeneousChain;
    },
    getMainInfo(chain) {
      const network = this.$store.state.network;
      const config = JSON.parse(sessionStorage.getItem("config"));
      return config[network][chain];
    },
    // 充值、提现加速
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
      this.fee = await this.crossInTransfer.getGasPrice(gasLimit);
      if (this.toNetwork !== "NERVE" && this.toNetwork !== "NULS") {
        this.extraFee = this.defaultWithdrawalFee;
      }
      this.feeLoading = false;
    },
    // 计算eth bnb加速跨链转账手续费
    async getSpeedUpFee() {
      this.feeLoading = true;
      const gasLimit = this.chooseAsset.contractAddress ? "100000" : "33594";
      this.fee = await this.crossInTransfer.getSpeedUpFee(gasLimit);
      if (this.toNetwork !== "NERVE" && this.toNetwork !== "NULS") {
        this.extraFee = this.defaultWithdrawalFee + 3;
      }
      this.feeLoading = false;
    },
    // 计算nerve提现到eth bsc手续费
    async calculateFee() {
      this.feeLoading = true;
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
      const result = await this.withdrawalTransfer.calWithdrawalNVTFee(
        this.nvtUSD,
        this.heterogeneousChainUSD,
        this.heterogeneousChain.token
      );
      const MAIN_INFO = this.getMainInfo("NERVE");
      const defaultFee = Number(divisionDecimals(result, MAIN_INFO.decimal));
      // const slow = defaultFee - 3 < 1 ? 1 : defaultFee - 3;
      // const fast = defaultFee + 3;
      const fee = defaultFee + this.normalFee;
      this.defaultWithdrawalFee = fee;
      if (this.fromNetwork === "NULS" || this.isCrossIn) {
        this.extraFee = fee;
      } else {
        this.fee = fee;
      }
      // this.defaultFeeList = [slow, defaultFee, fast];
      this.feeLoading = false;
    },
    //默认手续费 --- eth
    async calWithdrawFee() {
      const result = await this.withdrawalTransfer.calWithdrawFee(this.heterogeneousChain.token);
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
      this.checkCanCross();
      this.getHeterogeneousChain();
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
            this.transferModal.decimals
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
    checkForm(formName) {
      this.$refs[formName].validate(async valid => {
        if (valid) {
          const enoughFee = await checkBalance(this.confirmData.fee);
          console.log(enoughFee, 55555555555);
          if (enoughFee) {
            this.showConfirm = true;
          } else {
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
      let txHex = "";
      const fromNetwork = this.fromNetwork;
      const toNetwork = this.toNetwork;
      let hex1 = "",
        hex2 = "";
      try {
        if (fromNetwork === "NULS") {
          hex1 = await this.getNerveNuls("NULS"); // nuls 跨到nerve hex
          if (toNetwork !== "NERVE") {
            hex2 = await this.getWithdrawalHex("NERVE"); // nerve提现到eth，bnb hex
          }
        } else if (fromNetwork === "NERVE") {
          if (toNetwork === "NULS") {
            hex1 = await this.getNerveNuls("NERVE");
          } else {
            hex1 = await this.getWithdrawalHex();
          }
        } else {
          hex1 = await this.getCrossInHex(); // eht、bnb跨链到nerve hex
          if (toNetwork === "NULS") {
            hex2 = await this.getNerveNuls("NERVE");
          } else if (toNetwork !== "NERVE") {
            hex2 = await this.getWithdrawalHex();
          }
        }
      } catch (e) {
        console.error("跨链交易签名失败" + e);
        this.$message({
          type: "error",
          message: e,
          duration: 2000
        });
      }
      await this.broadcastTxCross(txHex);
      this.transferLoading = false;
    },
    async getNerveNuls(chain) {
      const network = this.$store.state.network;
      const MAIN_INFO = this.getMainInfo(chain);
      const currentAccount = this.$store.getters.currentAccount[network];
      const to = chain === "NULS" ? "NERVE" : "NULS";
      const type = chain === "NERVE" ? 10 : this.chooseAsset.contractAddress ? 16 : 10;
      const transfer = new NTransfer({
        chain,
        network,
        type
      });
      const transferInfo = {
        from: currentAccount[chain],
        to: currentAccount[to],
        assetsChainId: this.chooseAsset.chainId,
        assetsId: this.chooseAsset.assetId,
        amount: timesDecimals(this.transferModal.amount, this.chooseAsset.decimals),
        fee: timesDecimals(this.fee, MAIN_INFO.decimal)
      };
      let txData = {};
      let txHex = "";
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
      return txHex;
    },

    async getWithdrawalHex() {
      const network = this.$store.state.network;
      const transfer = new NTransfer({
        chain: "NERVE",
        network,
        type: 43
      });
      const MAIN_INFO = this.getMainInfo("NERVE");
      const currentAccount = this.$store.getters.currentAccount[network];
      const transferInfo = {
        from: currentAccount.NERVE,
        assetsChainId: this.chooseAsset.chainId,
        assetsId: this.chooseAsset.assetId,
        amount: timesDecimals(this.transferModal.amount, this.chooseAsset.decimals),
        proposalPrice: timesDecimals(Minus(this.fee, this.normalFee), MAIN_INFO.decimal),
        fee: timesDecimals(this.normalFee, MAIN_INFO.decimal)
      };
      const inputOuput = await transfer.inputsOrOutputs(transferInfo);
      const txData = {
        heterogeneousAddress: this.toAddress,
        heterogeneousChainId: this.heterogeneousChain.heterogeneousChainId
      };
      let txHex = "";
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
      return txHex;
    },

    async getCrossInHex() {
      const heterogeneousChainId = this.chain === "BSC" ? 102 : 101;
      const heterogeneousChainInfo = this.chooseAsset.heterogeneousList.filter(
        item => item.heterogeneousChainId === heterogeneousChainId
      )[0];
      // console.log(this.chooseAsset, 555)
      let txHex = "";
      try {
        txHex = await this.crossInTransfer.getCrossInTxHex({
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
  }
};
</script>
<style lang="less">
.inner-transfer {
  font-size: 12px;
  height: 100%;
  .el-icon-document {
    position: absolute;
    right: 22px;
    top: 25px;
  }
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
      .content {
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
    .fee {
      display: block;
      .fee-label {
        color: #a5abb2;
        margin-bottom: 2px;
      }
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
      .el-button--text {
        padding: 0;
      }
    }
    .btn {
      width: 100%;
      margin-top: 20px;
    }
  }
}
</style>

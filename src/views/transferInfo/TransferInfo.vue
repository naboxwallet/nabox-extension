<template>
  <div class="transfer-info">
    <div v-show="!showConfirm">
      <common-head>
        {{ $t("transferInfo.transferInfo1") }}
      </common-head>
      <div class="content" v-loading="loading">
        <div class="transfer-amount">
          <h1>
            <i :class=" txInfo.transType < 0 ? 'el-icon-minus':'el-icon-plus' "></i>
            {{txInfo.amount}} {{txInfo.symbol}}</h1>
          <h6 v-if="txInfo.isMultiCross">
          <span v-if="txInfo.crossStatus ===0 || txInfo.crossStatus ===2" class="yellow">
            {{ $t("crossStatusType." + txInfo.crossStatus) }}
          </span>
            <span v-else-if="txInfo.crossStatus ===1 || txInfo.crossStatus ===4" class="green">
            {{ $t("crossStatusType." + txInfo.crossStatus) }}
          </span>
            <span v-else-if="txInfo.crossStatus ===3 || txInfo.crossStatus ===5" class="red">
            {{ $t("crossStatusType." + txInfo.crossStatus) }}
          </span>
          </h6>
          <h6 v-else>
          <span v-if="txInfo.status ===0" class="yellow">
            {{ $t("statusType." + txInfo.status) }}
          </span>
            <span v-else-if="txInfo.status ===1" class="green">
            {{ $t("statusType." + txInfo.status) }}
          </span>
            <span v-else-if="txInfo.status ==='-1'" class="red">
            {{ $t("statusType." + txInfo.status) }}
          </span>
          </h6>
        </div>
        <div class="transfer-item">
          <label>TXID</label>
          <p class="click" @click="toUrl($route.query.txHash, 'hash', $route.query.chain)">
            {{superLong($route.query.txHash) }}
          </p>
        </div>
        <div class="transfer-item">
          <label>{{ $t("public.confirmHeight") }}</label>
          <p class="click" @click="toUrl(txInfo.height, 'height', txInfo.toChain)">{{ txInfo.height }}</p>
        </div>
        <div class="transfer-item">
          <label>{{ $t("public.fee") }}</label>
          {{ txInfo.fee }}
        </div>
        <div class="transfer-item">
          <label>{{ $t("public.txType") }}</label>
          {{ $t("type." + txInfo.type) }}
        </div>
        <div class="transfer-item">
          <label>{{ $t("public.createTime") }}</label>
          {{ txInfo.createTime }}
        </div>
        <div class="transfer-item remark-wrap">
          <label>{{ $t("public.remark") }}</label>
          <div class="fr remark" :title="txInfo.remark">
            {{ isShrinkage ? txInfo.remark : txInfo.remarks }}
            <i class="clicks" v-show="txInfo.remark" :class="isShrinkage ? 'el-icon-arrow-down':'el-icon-arrow-right'"
               @click="shrinkage"></i>
          </div>
        </div>
        <div class="line" style="margin:5px 0 20px 0"></div>

        <div class="transfer-tx-info" v-if="txInfo.isMultiCross">
          <div class="from">
            <p class="label">From</p>
            <div class="transfer-info">
              <span>{{ txInfo.fromChain }}</span>
              <p class="click" @click="toUrl(txInfo.fromAddress, 'address', txInfo.fromChain)">
                {{ superLong(txInfo.fromAddress) }}
              </p>
            </div>
            <div class="transfer-info">
              <span>TXID</span>
              <p class="click" @click="toUrl(txInfo.fromHash, 'hash', txInfo.fromChain)">
                {{ superLong(txInfo.fromHash) }}
              </p>
            </div>
          </div>

          <div class="to" v-show="txInfo.nerveAddress !== txInfo.toAddress && txInfo.nerveTxHash">
            <p class="label">Cross</p>
            <div class="transfer-info">
              <span>NERVE</span>
              <p class="click" @click="toUrl(txInfo.nerveAddress, 'address', 'NERVE')">
                {{superLong(txInfo.nerveAddress)}}
              </p>
            </div>
            <div class="transfer-info">
              <span>TXID</span>
              <p class="click" @click="toUrl(txInfo.nerveTxHash, 'hash', 'NERVE')">{{superLong(txInfo.nerveTxHash)}}</p>
            </div>
          </div>

          <div class="to">
            <p class="label">To</p>
            <div class="transfer-info">
              <span>{{ txInfo.toChain }}</span>
              <p class="click" @click="toUrl(txInfo.toAddress, 'address', txInfo.toChain)">
                {{superLong(txInfo.toAddress)}}
              </p>
            </div>
            <div class="transfer-info">
              <span>TXID</span>
              <p class="click" @click="toUrl(txInfo.toHash, 'hash', txInfo.toChain)">{{ superLong(txInfo.toHash) }}</p>
            </div>
            <div v-show="txInfo.crossStatus ===3" class="to-resend">
              <el-button type="success" size="mini" round @click="toResend">{{$t('public.toResend')}}</el-button>
            </div>
          </div>
        </div>
        <template v-else>
          <div class="transfer-item">
            <label>From</label>
            <span class="click" @click="toUrl(txInfo.fromAddress, 'address')">
            {{ superLong(txInfo.fromAddress) }}
          </span>
          </div>
          <div class="transfer-item">
            <label>To</label>
            <span class="click" @click="toUrl(txInfo.toAddress, 'address')">
            {{ superLong(txInfo.toAddress) }}
          </span>
          </div>
        </template>
      </div>
    </div>

    <transfer-confirm :data="confirmData" :visiable.sync="showConfirm" @confirm="submit">
    </transfer-confirm>
  </div>
</template>

<script>
  import CommonHead from "@/components/CommonHead";
  import {
    superLong,
    divisionDecimals,
    getOrigin,
    timesDecimals,
    Minus,
    getAssetNerveInfo,
    getSymbolUSD
  } from "@/utils/util";
  import TransferConfirm from "@/components/TransferConfirm";
  import {NTransfer, ETransfer} from "@/utils/api";

  export default {
    data() {
      this.normalFee = 0.001;
      return {
        loading: true,
        isShrinkage: false,
        showConfirm: false,
        txInfo: {},//交易详情
        chooseAsset: {},//资产信息
        nvtUSD: {},
        heterogeneousChain_In: {}, // 跨链转入异构链
        heterogeneousChain_Out: {}, // 跨链转出的异构链
        fee: "",//手续费，
        extraFee: "", //跨链非本链手续费
        speedUpFee: false, // eth bsc加速
        //defaultWithdrawalFee: "",
        transferInfo: {},//重发信息
      };
    },

    components: {
      CommonHead,
      TransferConfirm
    },

    watch: {},

    computed: {
      confirmData() {
        const account = this.$store.getters.currentAccount;
        const network = this.$store.state.network;
        const fromAddress = account[network].NERVE;
        let fee = this.txInfo.toChain === 'NULS' ? "0.01 NVT + 0.01 NULS" : this.fee + 'NVT';
        return {
          from: superLong(fromAddress, 12),
          to: superLong(this.txInfo.toAddress, 12),
          amount: this.txInfo.amount,
          assetSymbol: this.txInfo.symbol,
          fee: fee,
          network: this.txInfo.toChain,
          remarks: this.txInfo.remark
        };
      }
    },

    created() {
      this.getTxInfo();
    },

    mounted() {
    },

    methods: {

      superLong(str, len = 12) {
        return superLong(str, len);
      },

      //获取交易详情
      async getTxInfo() {
        const {chain, txHash, transCoinId} = this.$route.query;
        const res = await this.$request({url: "/tx/coin/info", data: {chain, txHash, transCoinId}});
        //console.log(res);
        if (res.code === 1000) {
          const data = res.data;
          //console.log(data);
          const commonInfo = {
            amount: divisionDecimals(data.tx.amount, data.tx.decimals),
            createTime: data.tx.createTime,
            fee: data.tx.fee,
            symbol: data.tx.symbol,
            remark: data.tx.remark,
            type: data.tx.type,
            height: data.tx.height,
            transType: data.tx.transType,
          };
          let txInfo = {};
          if (data.crossTx) {
            const account = this.$store.getters.currentAccount;
            const network = this.$store.state.network;
            //console.log(account, network);
            const address = account[network].NERVE;
            txInfo = {
              fromChain: data.crossTx.fromChain,
              fromAddress: data.crossTx.fromAddress,
              fromHash: data.crossTx.txHash,
              toChain: data.crossTx.toChain,
              toAddress: data.crossTx.toAddress,
              toHash: data.crossTx.crossTxHash,
              crossStatus: data.crossTx.status,
              isMultiCross: true,
              assetId: data.crossTx.assetId,
              chainId: data.crossTx.chainId,
              nerveTxHash: data.crossTx.fromChain !== 'NERVE' ? data.crossTx.nerveTxHash : '',
              nerveAddress: address,
              ...commonInfo
            };
          } else {
            txInfo = {
              fromAddress: data.tx.froms,
              toAddress: data.tx.tos,
              hash: data.tx.id,
              status: data.tx.status,
              toHash: data.tx.id,
              ...
                commonInfo
            }
            ;
          }
          this.txInfo = txInfo;
          if (txInfo.remark && txInfo.remark.length > 15) {
            txInfo.remarks = data.tx.remark.slice(0, 15) + '...'
          } else {
            txInfo.remarks = data.tx.remark
          }
          //console.log(this.txInfo);
          if (this.txInfo.crossStatus === 3) {
            this.getAssetsList();
          }
          this.loading = false;
        }
      },

      //备注收缩
      shrinkage() {
        this.isShrinkage = !this.isShrinkage;
      },

      // 查询from网络资产列表
      async getAssetsList() {
        const account = this.$store.getters.currentAccount;
        const network = this.$store.state.network;
        //console.log(account, network);
        const params = {chain: "NERVE", address: account[network].NERVE};
        //console.log(params);
        const res = await this.$request({url: "/wallet/address/assets", data: params});
        //console.log(res, this.txInfo, "getAssetsList");
        if (res.code === 1000) {
          if (this.txInfo.toChain !== 'NULS') { //to 其他系
            this.chooseAsset = res.data.filter(item => item.chainId === this.txInfo.chainId && item.assetId === this.txInfo.assetId)[0];
            this.toEBH();
          } else {
            this.chooseAsset = res.data.filter(item => item.symbol === this.txInfo.symbol)[0]; //todo symbol可能重复
          }
          //console.log(this.chooseAsset);
        }
      },

      //重发到nuls网络 交易组装
      async toNuls() {
        const transfer = new NTransfer({chain: 'NERVE', network: this.$store.state.network, type: 10});
        let transferInfo = {
          from: this.txInfo.nerveAddress,
          to: this.txInfo.toAddress,
          assetsChainId: this.chooseAsset.chainId,
          assetsId: this.chooseAsset.assetId,
          amount: timesDecimals(this.txInfo.amount, this.chooseAsset.decimals),
          fee: timesDecimals(0.01, this.chooseAsset.decimals)
        };
        const inputOuput = await transfer.inputsOrOutputs(transferInfo);
        //console.log(inputOuput);
        try {
          let txHex = await transfer.getTxHex({
            inputs: inputOuput.inputs,
            outputs: inputOuput.outputs,
            remarks: this.txInfo.remarks ? this.txInfo.remarks.toString() : ''
          });
          return {success: true, data: txHex}
        } catch (e) {
          return {success: false, data: e}
        }

      },

      //重发到BSC ERC20 hoce
      async toEBH() {
        this.withdrawalTransfer = new ETransfer({chain: this.txInfo.toChain, network: this.$store.state.network});
        this.getHeterogeneousChain();
        const nvtUSD = await getSymbolUSD("NERVE");
        this.nvtUSD = nvtUSD + "";
        const heterogeneousChainUSD = await getSymbolUSD(this.txInfo.toChain);
        //异构链usd价格
        this.heterogeneousChainUSD = heterogeneousChainUSD + "";
        this.calWithdrawalNVTFee();
      },

      //重新发送
      async toResend() {
        this.showConfirm = true;
      },

// 获取跨链转入、跨链转出的异构链
      getHeterogeneousChain() {
        this.heterogeneousChain_In = {};
        this.heterogeneousChain_Out = {};
        if (!this.chooseAsset.heterogeneousList) return;
        const heterogeneousChain_In = this.chooseAsset.heterogeneousList.filter(
          v => v.chainName === "NERVE"
        )[0];
        const heterogeneousChain_Out = this.chooseAsset.heterogeneousList.filter(
          v => v.chainName === this.txInfo.toChain
        )[0];
//console.log(heterogeneousChain_In, "in--out", heterogeneousChain_Out);
        this.heterogeneousChain_In = heterogeneousChain_In || {};
        this.heterogeneousChain_Out = heterogeneousChain_Out || {};
      },

//获取默认手续费 -nvt
      async calWithdrawalNVTFee() {
//console.log(this.heterogeneousChain_Out, 6566);
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
        this.fee = fee;
        //console.log("this.defaultWithdrawalFee:" + this.defaultWithdrawalFee)
      },

      async getWithdrawalHex() {
        const network = this.$store.state.network;
        const transfer = new NTransfer({chain: "NERVE", network, type: 43});
        const MAIN_INFO = this.getMainInfo("NERVE");
        const currentAccount = this.$store.getters.currentAccount[network];
        const transferInfo = {
          from: currentAccount.NERVE,
          amount: timesDecimals(this.txInfo.amount, this.chooseAsset.decimals),
          proposalPrice: timesDecimals(Minus(this.defaultWithdrawalFee, this.normalFee), MAIN_INFO.decimal),
          fee: timesDecimals(this.normalFee, MAIN_INFO.decimal),
          // ...assetInfo
        };
        const params = this.chooseAsset.contractAddress
          ? {
            network,
            fromChain: this.fromNetwork,
            contractAddress: this.chooseAsset.contractAddress,
          }
          : {
            network,
            fromChain: this.fromNetwork,
            assetsChainId: this.chooseAsset.chainId,
            assetsId: this.chooseAsset.assetId
          };
        const assetNerveInfo = await getAssetNerveInfo(params);
        if (assetNerveInfo) {
          transferInfo.assetsChainId = assetNerveInfo.chainId;
          transferInfo.assetsId = assetNerveInfo.assetId === 0 ? this.chooseAsset.assetId : assetNerveInfo.assetId;
        } else {
          throw "获取该资产在nerve链上信息失败";
        }
        const inputOuput = await transfer.inputsOrOutputs(transferInfo);

        const txData = {
          heterogeneousAddress: this.txInfo.toAddress,
          heterogeneousChainId: this.heterogeneousChain_Out.heterogeneousChainId
        };
        return await transfer.getTxHex({
          inputs: inputOuput.inputs,
          outputs: inputOuput.outputs,
          remarks: this.txInfo.remarks ? this.txInfo.remarks : '',
          txData
        });
      },

      //确认
      async submit() {
        let hex = "";
        if (this.txInfo.toChain === 'NULS') {
          let resData = await this.toNuls();
          //console.log(resData);
          if (!resData.success) {
            console.log(resData.data);
            return;
          }
          hex = resData.data
        } else {
          hex = await this.getWithdrawalHex();
        }
          //console.log(hex, "hex");
        const resData = await this.$request({
          url: "/tx/retry/cross",
          data: {txHash: this.txInfo.fromHash, crossTxHex: hex}
        });
        this.loading = false;
        this.showConfirm = false;
        if (resData.code === 1000) {
          this.$message({type: "success", message: this.$t("transfer.transfer13"), duration: 2000});
          setTimeout(() => {
            this.$router.push("/");
          }, 500);
        } else {
          this.$message({type: "warning", message: resData.msg, duration: 3000});
        }
      },

      getMainInfo(chain) {
        const network = this.$store.state.network;
        const config = JSON.parse(localStorage.getItem("config"));
        return config[network][chain];
      },

      //连接跳转
      toUrl(query, type, openChain) {
        //console.log(query, type, openChain);
        const chain = openChain || this.$route.query.chain;
        const origin = getOrigin(chain, this.$store.state.network);
        let url = "";
        if (chain === "NULS" || chain === "NERVE") {
          if (type === "address") {
            url = "/address/info?address=" + query;
          } else if (type === "hash") {
            url = "/transaction/info?hash=" + query;
          }
        } else {
          if (type === "address") {
            url = "/address/" + query;
          } else if (type === "hash") {
            url = "/tx/" + query;
          } else if (type === "height") {
            url = "/block/" + query;
          }
        }
        window.open(origin + url);
      },
    }
  }
  ;
</script>

<style lang="less">
  .transfer-info {
    position: relative;
    .content {
      padding: 15px 20px 0;
    }
    .transfer-amount {
      height: 80px;
      text-align: center;
      border-bottom: 1px solid #e9ebf3;
      margin-bottom: 20px;
      h1 {
        font-size: 22px;
        font-weight: bold;
        i {
          font-size: 12px;
          position: relative;
          font-weight: bold;
          top: -3.5px;
          right: -5px;
        }
      }
      h6 {
        font-size: 14px;
      }
    }
    .transfer-item {
      display: flex;
      margin-bottom: 15px;
      color: #3a3c44;
      line-height: 1.2;
      font-size: 12px;
      label {
        width: 70px;
        color: #a5abb2;
        font-size: 12px;
      }
      .click {
        word-break: break-all;
        flex: 1;
      }
      .from-info, .to-info {
        span {
          color: #6d757c;
          // font-size: 12px;
        }
        p {
          font-size: 14px;
          padding: 5px 0;
        }
      }
    }
    .remark-wrap {
      flex-wrap: wrap;
      span {
        word-break: break-all;
      }
      .remark {
        width: 77%;
        word-break: break-all;
        i {
          position: absolute;
          right: 30px;
          margin-top: 5px;
        }
      }
    }
    .transfer-tx-info {
      .from, .to {
        margin-bottom: 12px;
      }
      .label {
        color: #a5abb2;
        font-size: 12px;
        margin-bottom: 2px;
      }
      .transfer-info {
        display: flex;
        color: #3a3c44;
        line-height: 1.4;
        font-size: 12px;
        align-items: center;
        span {
          width: 70px;
          color: #6d757c;
        }
        p {
          font-size: 14px;
        }
      }
      .to-resend {
        text-align: right;
      }
    }

  }
</style>

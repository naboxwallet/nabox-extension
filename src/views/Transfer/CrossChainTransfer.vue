<template>
  <div class="cross-chain-transfer" v-loading="transferLoading">
    <transition name="fade-transform" mode="out-in">
      <div v-show="!showConfirm">
        <common-head>{{ $t("home.home8") }}</common-head>
        <div class="transfer-page">
          <el-form :model="transferForm" :rules="rulesTransfer" ref="transferForm" class="transfer-form">
            <div style="min-height: 400px">
              <el-form-item :label="$t('transferConfirm.transferConfirm3')" prop="toAddress">
                <el-input :placeholder="$t('tips.tip0')" v-model.trim="transferForm.toAddress" autocomplete="off">
                </el-input>
              </el-form-item>
              <el-form-item :label="$t('crossTxList.crossTxList2')" class="network" prop="network">
                <el-radio-group v-model="transferForm.network" class="network-list" @change="changeNetworks">
                  <el-radio-button v-for="(item,index) in networkList"
                                   :label="item.assets[0].lable"
                                   :key="index">
                  </el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item :label="$t('public.amount')" class="amount" :class="amountTip ? 'is-errors':''">
                <div style="font-size: 12px;color: #aab2c9;position: absolute;right: 2px;top: -30px; line-height: 30px">
                  {{$t('public.available')}}: {{chooseAsset.balance}}
                </div>
                <el-input :placeholder="$t('tips.tip1')" class="input-with-select"
                          v-model.trim="transferForm.amount" @blur="changeAmount" @input="limitInput($event,'amount')">
                  <el-select v-model="transferForm.assets" slot="prepend" :placeholder="$t('tips.tip2')"
                             @change="changeAssets">
                    <el-option v-for="(item,index) in assetsList" :key="index" :label="item.symbol" :value="item.ids">
                    </el-option>
                  </el-select>
                </el-input>
                <div style="position: absolute;left: 88px;top: 17px; width: 1px;height: 13px;background: #bac0d3"></div>
                <div class="clicks" style="position: absolute;right: 10px;top: 2px;font-size: 12px;" @click="changeAll">
                  {{$t('public.all')}}
                </div>
                <div style="font-size: 12px;line-height: 20px;color: #F56C6C" v-if="amountTip">{{amountTip}}</div>
              </el-form-item>
              <p class="approve-tip" v-if="needAllowance">
                <img v-if="refreshAllowance" src="../../assets/img/loading.svg"/>
                <template v-else>
                  <span>{{ $t("transfer.transfer22") }}</span>
                  <el-button type="text" @click="approveERC20">
                    {{ $t("transfer.transfer23") }}
                  </el-button>
                  &nbsp;&nbsp;&nbsp;
                  <i class="el-icon-refresh click" @click="getERC20Allowance"></i>
                </template>
              </p>
              <el-form-item :label="$t('public.fee')" prop="fee" class="fee-div">
                <div v-if="feeType ==='0'">
                  <div v-if="feeLoading">
                    <img src="./../../assets/img/loading.svg"/>
                  </div>
                  <span v-else v-for="(item,index) in feeList" :key="index">
                  {{item.fee}} {{item.symbol}} {{item.iconPlus}}
                </span>
                </div>
                <div v-else>
                  <div v-if="feeLoading">
                    <img src="./../../assets/img/loading.svg"/>
                  </div>
                  <div v-else>
                    <el-radio-group v-model="feeType" size="medium" class="fee-list" @change="changeFeeType">
                      <el-radio-button label="1">
                        <h5>{{$t('public.low')}}</h5>
                        <p>
                          <span v-if="transferForm.toAddress">{{multiplication(feeCross,0.8)}}</span>
                          <span v-else>--</span>{{feeCrossSysmol}}
                        </p>
                      </el-radio-button>
                      <el-radio-button label="2">
                        <h5>{{$t('public.centre')}}</h5>
                        <p>
                          <span v-if="transferForm.toAddress">{{feeCross}}</span>
                          <span v-else>--</span>{{feeCrossSysmol}}
                        </p>
                      </el-radio-button>
                      <el-radio-button label="3">
                        <h5>{{$t('public.high')}}</h5>
                        <p>
                          <span v-if="transferForm.toAddress">{{multiplication(feeCross,1.3)}}</span>
                          <span v-else>--</span>{{feeCrossSysmol}}
                        </p>
                      </el-radio-button>
                      <el-radio-button label="4" class="custom">
                        <h5 style="line-height: 28px;">{{$t("public.custom")}}</h5>
                      </el-radio-button>
                    </el-radio-group>
                    <div class="custom-info" v-show="feeType==='4'">
                      <div v-if="chain ==='NERVE'">
                        <div class="nvt-fee">
                          <p>NVT</p>
                          <el-input placeholder="" v-model="feeCross">
                          </el-input>
                        </div>
                      </div>
                      <div v-else>
                        <div class="fl gas">
                          <p>GasPrice(GWEI)</p>
                          <el-input placeholder="" v-model="gwei">
                          </el-input>
                        </div>
                        <div class="fr limit">
                          <p>Gaslimit</p>
                          <el-input placeholder="" v-model="gasLimit">
                          </el-input>
                        </div>
                      </div>
                      <div class="clear"></div>
                      <div class="num">{{feeCross}} {{feeCrossSysmol}} ≈ $ {{feeUsdt}}</div>
                    </div>
                  </div>
                </div>
              </el-form-item>
              <!--<el-form-item :label="$t('public.remark')" prop="remark" v-show=" type===1 || type===2 || type === 16">-->
              <el-form-item :label="$t('public.remark')" prop="remark" v-show="type===2 || type === 16">
                <el-input type="textarea" v-model="transferForm.remark" :rows="2">
                </el-input>
              </el-form-item>
              <el-form-item label=" " prop="agree" class="agree" v-show="type===10">
                <el-checkbox v-model="transferForm.agree">
                  <span class="all_label">{{$t('tips.tip3')}}</span>
                </el-checkbox>
              </el-form-item>
              <el-form-item label=" " class="agree" v-show="type===0">
                <el-checkbox v-model="transferForm.agreeTwo">
                  <span class="all_label">{{$t('tips.tip19')}}</span>
                </el-checkbox>
              </el-form-item>
            </div>
            <el-form-item class="transfer-form-btn">
              <el-button type="primary" :disabled="isNext" @click="submitTransferForm('transferForm')">
                {{$t('public.next')}}
              </el-button>
            </el-form-item>
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
    timesDecimals,
    Plus,
    Times,
    divisionDecimals,
    getSymbolUSD,
    chainToSymbol,
    tofix,
    superLong,
    Division,
    Minus
  } from "@/utils/util";
  import nerve from "nerve-sdk-js";
  import {NTransfer, ETransfer, crossFee, validateAddress} from "@/utils/api";
  import {getContractCallData} from "@/utils/nulsContractValidate";

  export default {
    data() {
      let validateToAddress = (rule, value, callback) => {

        const isEAddress = validateAddress(value); //验证是否是以太坊地址
        //console.log(isEAddress, this.chain, value, 'validateToAddress');

        let verifyInfo = {};
        try {
          verifyInfo = nerve.verifyAddress(value); //验证普通地址
          //console.log(verifyInfo);
        } catch (err) {
          console.log(err)
        }
        if (!isEAddress && !verifyInfo.chainId) {
          callback(new Error(this.$t('tips.tip10')));
        }
        //console.log(this.chain,8888);
        if (value === '') {
          callback(new Error(this.$t('tips.tip9')));
          this.networkList = [];
          if (this.chain === 'NERVE' || this.chain === 'NULS') {
            for (let item in this.sessionConfig) {
              if (this.sessionConfig[item].assetId && this.sessionConfig[item].assets.length !== 0) {
                this.networkList.push(this.sessionConfig[item]);
              }
            }
          } else {
            this.networkList.push(this.sessionConfig[this.chain]);
            this.networkList.push(this.sessionConfig['NERVE']);
          }
          this.transferForm.network = '';
        } else if (this.chain === 'NERVE') {
          callback();
        } else if (this.chain === 'NULS') {
          //console.log(verifyInfo,"verifyInfo");
          if (verifyInfo.chainId === 2 || verifyInfo.chainId === 1) {
            callback();
          } else if (verifyInfo.chainId === 5 || verifyInfo.chainId === 9) {
            callback();
          } else {
            callback(new Error(this.$t('tips.tip10')));
            this.networkList = [];
            //console.log(this.sessionConfig, 789);
            /* for (let item in this.sessionConfig) {
               if (this.sessionConfig[item].assetId && this.sessionConfig[item].assets.length !== 0) {
                 this.networkList.push(this.sessionConfig[item]);
               }
             }*/
            this.getNetworkList();
            this.transferForm.network = '';
          }
        } else {
          //console.log(isEAddress, verifyInfo, "------------");
          if (!isEAddress) {
            if (verifyInfo.chainId === 5 || verifyInfo.chainId === 9) {
              callback();
            } else {
              this.networkList = [];
              callback(new Error(this.$t('tips.tip10')));
              this.networkList.push(this.sessionConfig[this.chain]);
              this.networkList.push(this.sessionConfig['NERVE']);
              this.transferForm.network = '';
            }
          } else {
            callback();
          }
        }
      };
      return {
        chain: "",
        networkList: [],//可选择的网络列表
        allAssetsList: [],//所有的资产列表
        assetsList: [], //资产列表
        chooseAsset: 0,//选中的资产信息
        feeType: '0', //手续费等级 0: 普通 1：慢，2：中，3：快
        feeCross: 0,//跨链手续费
        feeCrossSysmol: 'NVT',//跨链手续费单位
        gasLimit: 0,//
        gasPrice: 0,//
        gwei: 0,
        assetPrice: 0,//资产价格$
        feeUsdt: 0,//约等于美元
        gasPriceOld: 0,//记录的平均gasPrice
        speedUpFee: false, // eth bsc加速
        feeLoading: false,
        custom: false, // nerve提现到eth bsc是否自定义手续费
        feeList: [
          {fee: 0.001, symbol: 'NVT', iconPlus: ''}
        ],//手续费列表
        transferForm: {
          fromAddress: '',
          toAddress: '',
          network: '',
          assets: '',
          amount: '',
          gas: 1,
          price: 25,
          fee: '0.001',
          remark: '',
          agree: false,
          agreeTwo: false
        },
        rulesTransfer: {
          toAddress: [
            {validator: validateToAddress, trigger: ['change', 'blur']}
          ],
          network: [
            {required: true, message: this.$t('tips.tip16'), trigger: ['change', 'blur']}
          ],
          agree: [
            {required: true, message: this.$t('public.know'), trigger: 'change'}
          ],
        },
        amountTip: '',//金额提示信息
        nulsType: '',//nuls合约转账类型[nulsToContract:向合约地址转nuls-_payable,tokenTransfer:token转账-transfer,tokenCrossTransfer:合约跨链]
        transferLoading: false,//加载动画
        showConfirm: false,//显示确认弹框
        selectHeterogeneousChain: "ETH",
        type: 2, //nerve nuls 交易类型 1:（eth）链内转账 2:转账 10：跨链交易 43：跨链转出
        heterogeneousChain_In: {}, // 跨链转入异构链
        heterogeneousChain_Out: {}, // 跨链转出的异构链
        needAllowance: false, // erc20 资产跨链转入到nerve是否需要授权
        refreshAllowance: false,//查询授权金额
        isNext: false,//下一步是否可点
      };
    },

    components: {
      CommonHead,
      TransferConfirm
    },

    watch: {
      "transferForm.toAddress"(val) {
        //this.networkList = [];
        const isEAddress = validateAddress(val); //验证是否是以太坊地址
        //console.log(isEAddress);

        let verifyInfo = {};
        try {
          verifyInfo = nerve.verifyAddress(val); //验证普通地址
          //console.log(verifyInfo);
        } catch (err) {
          console.log(err)
        }
        // console.log(this.chain,isEAddress,verifyInfo);
        if (this.chain === 'NERVE') { //from为nerve系
          if (isEAddress) {
            //console.log(this.sessionConfig);
            this.networkList = [];
            this.networkList.push(this.sessionConfig['Ethereum']);
            this.networkList.push(this.sessionConfig['BSC']);
            this.networkList.push(this.sessionConfig['Heco']);
            this.networkList.push(this.sessionConfig['OKExChain']);
            this.type = 43;
            this.feeList = [
              {fee: 0.001, symbol: 'NVT', iconPlus: ''}
            ];
            this.transferForm.fee = 0.001;
          } else if (verifyInfo.chainId === 2 || verifyInfo.chainId === 1) {
            this.networkList = [];
            this.networkList.push(this.sessionConfig['NULS']);
            this.type = 10;
            this.feeList = [
              {fee: 0.01, symbol: 'NVT', iconPlus: '+'},
              {fee: 0.01, symbol: 'NULS', iconPlus: ''}
            ]
          } else if (verifyInfo.chainId === 5 || verifyInfo.chainId === 9) {
            this.networkList = [];
            this.networkList.push(this.sessionConfig['NERVE']);
            this.type = 10;
            this.feeList = [
              {fee: 0.001, symbol: 'NVT', iconPlus: ''}
            ]
          }
          this.feeType = '0';
          this.changeAssets();
        } else if (this.chain === 'NULS') {
          this.networkList = [];
          if (verifyInfo.chainId === 2 || verifyInfo.chainId === 1) {
            if (verifyInfo.type === 1) {
              this.networkList.push(this.sessionConfig['NULS']);
              this.type = 2;
              this.feeList = [
                {fee: 0.001, symbol: 'NULS', iconPlus: ''}
              ]
            } else if (verifyInfo.type === 2) {
              this.networkList.push(this.sessionConfig['NULS']);
              this.type = 16;
              this.changeAssets();
            }
          } else if (verifyInfo.chainId === 5 || verifyInfo.chainId === 9) {
            this.networkList.push(this.sessionConfig['NERVE']);
            this.type = 10;
            this.feeList = [
              {fee: 0.01, symbol: 'NULS', iconPlus: ''}
            ];
            this.assetsList = [];
            let mianAssets = this.allAssetsList.filter(v => !v.contractAddress);
            let nrc20CrossList = this.allAssetsList.filter(v => v.nulsCross);

            let newList = [...mianAssets, ...nrc20CrossList];

            let newArr = newList.filter((x, index) => {
              let arrids = [];
              newList.forEach((item) => {
                arrids.push(item.ids)
              });
              return arrids.indexOf(x.ids) === index
            });
            this.assetsList = newArr;
          } else {
            //console.log(this.networkList);
            //this.getNetworkList();
          }
        } else { //from为其他系
          this.networkList = [];
          if (isEAddress) {
            this.networkList.push(this.sessionConfig[this.chain]);
            //console.log(this.chain);
            if (this.chain === 'Ethereum' || this.chain === 'BSC' || this.chain === 'Heco' || this.chain === 'OKExChain') {
              this.type = 1;
              this.getGasPrice();
            }
          } else if (verifyInfo.chainId === 5 || verifyInfo.chainId === 9) {
            this.networkList.push(this.sessionConfig['NERVE']);
            this.type = 0;
            this.getGasPrice();
          }
          //console.log(this.type)

          if (this.transferForm.amount && this.transferForm.network) {
            this.changeAmount();
          }
        }

        if (this.chain === 'NERVE' && isEAddress) {
          this.transferForm.network = '';
        } else {
          this.transferForm.network = this.networkList.length !== 0 ? this.networkList[0].assets[0].chain : '';
          this.transferForm.network = this.transferForm.network === 'Ethereum' ? 'ERC20' : this.transferForm.network;
        }
        this.transferForm.amount = '';
        this.changeAssets();
      },

      "transferForm.network"(val) {
        //console.log(val);
        val = val === 'ERC20' ? 'Ethereum' : val;
        const network = this.$store.state.network;
        if (this.chain === "NERVE") {
          if (val === "NULS") {
            this.type = 10;
          } else if (val === "NERVE") {
            this.type = 2;
          } else {
            this.type = 43;
            this.selectHeterogeneousChain = chainToSymbol[val];
            this.eTransfer = new ETransfer({chain: val, network});
            this.getHeterogeneousChain();
            this.calculateFee();
          }
        } else if (this.chain === "NULS") {
          this.feeLoading = false;
          this.fee = crossFee;
        } else {
          this.eTransfer = new ETransfer({chain: this.chain, network});
          this.getHeterogeneousChain();
        }

        if (this.transferForm.toAddress && this.transferForm.amount) {
          this.changeAmount();
        }
      },

      "gwei"(val) {
        if (this.feeType === '4') {
          this.feeCross = divisionDecimals(Times(val, this.gasLimit), 9).toString();
          this.feeUsdt = Times(this.feeCross, this.assetPrice).toString()
        }
      },

      "gasLimit"(val) {
        if (this.feeType === '4') {
          this.feeCross = divisionDecimals(Times(val, this.gwei), 9).toString();
          this.feeUsdt = Times(this.feeCross, this.assetPrice).toString()
        }
      },

      "feeCross"() {
        if (this.feeType === '4' && this.chain === 'NERVE') {
          this.feeUsdt = Times(this.feeCross, this.assetPrice).toString()
        }
      }
    },

    computed: {
      confirmData() {
        let feeInfo = '';
        if (this.type === 43 || this.feeCrossSysmol !== 'NVT') {
          if (this.feeType === '1') {
            //feeInfo = this.feeCrossSysmol === 'NVT' ? Number(this.feeCross) - 3 : this.multiplication(this.feeCross, 0.8)
            feeInfo = this.multiplication(this.feeCross, 0.8)
          } else if (this.feeType === '3') {
            //feeInfo = this.feeCrossSysmol === 'NVT' ? Number(this.feeCross) + 3 : this.multiplication(this.feeCross, 1.2)
            feeInfo = this.multiplication(this.feeCross, 1.3)
          } else {
            feeInfo = this.feeCross
          }
          feeInfo = feeInfo + '' + this.feeCrossSysmol;
          //this.transferForm.agree = true;
        } else if (this.type === 10) {
          for (let item of this.feeList) {
            feeInfo = feeInfo + item.fee + ' ' + item.symbol + ' ' + item.iconPlus
          }
        } else if (this.chain === 'NULS' && this.type === 2) {
          feeInfo = 0.001 + ' NULS';
        } else if (this.type === 16) {
          feeInfo = this.transferForm.fee + ' NULS';
        } else if (this.chain === 'NERVE' && this.type === 2) {
          //feeInfo = 0.001 + ' NVT';
          feeInfo = 0.00 + ' NVT';
        }
        return {
          from: superLong(this.transferForm.fromAddress, 12),
          to: superLong(this.transferForm.toAddress, 12),
          amount: this.transferForm.amount,
          assetSymbol: this.chooseAsset.symbol,
          network: this.transferForm.network === 'ERC20' ? 'Ethereum' : this.transferForm.network,
          fee: feeInfo,
          remarks: this.transferForm.remark,
          type: this.type,
        };
      },
    },

    async created() {
      this.feeList[0].symbol = this.$route.query.chain === 'NULS' ? 'NULS' : "NVT";

      const {address, chain, assetChainId, assetId, contractAddress} = this.$route.query;
      const network = this.$store.state.network;
      const config = JSON.parse(localStorage.getItem("config"))[this.$store.state.network];
      for (let item in config) {
        config[item].assets[0].lable = config[item].assets[0].chain === 'Ethereum' ? "ERC20" : config[item].assets[0].chain
      }
      this.sessionConfig = config;
      this.chain = chain;
      this.transferForm.fromAddress = address;
      this.assetChainId = assetChainId;
      this.assetId = assetId;
      this.contractAddress = contractAddress;
      this.feeSymbol = chainToSymbol[this.chain];
      this.MAIN_INFO = this.sessionConfig[this.chain];
      if (this.chain !== "NULS" && this.chain !== "NERVE") {
        this.eTransfer = new ETransfer({chain: this.chain, network});
        this.feeType = 2;
        this.type = 1;
        this.feeLoading = true;
        if (this.chain === "Ethereum") {
          this.calWithdrawFee()
        } else {
          this.getGasPrice()
        }
      } else {
        this.MAIN_INFO = this.sessionConfig[this.chain];
        //console.log(this.MAIN_INFO, "==MAIN_INFO==")
      }
      await this.getAssetsList();
    },

    mounted() {
      this.getNetworkList();
      this.getAssetPrice(this.chain)

    },

    methods: {

      //计算高低手续费
      multiplication(num, val) {
        //console.log(this.feeType);
        if (this.feeType !== '4') {
          return Times(num, val).toString();
        }
      },

      /**
       * @disc: 获取可选网络信息
       * @params:
       * @date: 2021-02-01 11:44
       * @author: Wave
       */
      getNetworkList() {
        if (this.chain === 'NERVE') {
          for (let item in this.sessionConfig) {
            if (this.sessionConfig[item].assetId && this.sessionConfig[item].assets.length !== 0) {
              this.networkList.push(this.sessionConfig[item]);
            }
          }
        } else {
          this.networkList.push(this.sessionConfig[this.chain]);
          this.networkList.push(this.sessionConfig['NERVE']);
        }
      },

      /**
       * @disc: 获取资产列表
       * @params:
       * @date: 2021-02-01 11:32
       * @author: Wave
       */
      async getAssetsList() {
        const params = {chain: this.chain, address: this.transferForm.fromAddress};
        const res = await this.$request({url: "/wallet/address/assets", data: params});
        if (res.code === 1000) {
          res.data.map(v => {
            v.balance = divisionDecimals(v.balance, v.decimals);
            v.ids = this.getKey(v);
          });
          this.assetsList = res.data;
          //console.log(this.assetsList);
          this.allAssetsList = res.data;

          let chainId = this.$route.query.assetChainId ? Number(this.$route.query.assetChainId) : '';
          let assetId = this.$route.query.assetId ? Number(this.$route.query.assetId) : '';
          let contractAddress = this.$route.query.contractAddress;
          let defaultAsset = {};
          if (chainId && assetId) {
            defaultAsset = res.data.filter(item => item.chainId === chainId && item.assetId === assetId)[0];
          } else if (contractAddress) {
            defaultAsset = res.data.filter(item => item.contractAddress === contractAddress)[0];
          } else {
            defaultAsset = res.data[0];
          }
          this.chooseAsset = defaultAsset;
          this.transferForm.assets = this.chooseAsset.ids;
        }
      },

      /**
       * @disc: 组装 key
       * @params: item
       * @date: 2021-02-01 14:01
       * @author: Wave
       */
      getKey(item) {
        return item.contractAddress ? item.contractAddress : item.chainId + "-" + item.assetId;
      },

      //选择网络
      changeNetworks() {
        if (!this.transferForm.toAddress) {
          return;
        }
        let newAssetsList = [];
        //console.log(this.allAssetsList, this.transferForm.network);
        let chainName = this.transferForm.network === 'ERC20' ? 'Ethereum' : this.transferForm.network;
        //console.log(chainName);
        for (let item of this.allAssetsList) {
          for (let k of item.heterogeneousList) {
            if (k.chainName === chainName) {
              newAssetsList.push(item);
            }
          }
        }
        this.assetsList = newAssetsList;
        this.transferForm.assets = this.assetsList[0].ids;
        this.transferForm.amount = '';
        //console.log(this.assetsList);
      },

      //选择资产
      changeAssets() {
        this.chooseAsset = this.assetsList.filter(item => item.ids === this.transferForm.assets)[0];
        this.needAllowance = false;
        //console.log(this.assetsList,this.transferForm.assets,this.chooseAsset, this.chain, "changeAssets");
        if (this.chain === 'NERVE') {
          if (this.chooseAsset.ids === '5-1') {
            if (this.type === 2) {
              this.feeList[0].fee = 0.00; //nvt 转账免手续费
            }
          } else {
            this.feeList[0].fee = 0.001;
            if (this.type === 10) {
              this.feeList[0].fee = 0.01;
            }
          }
        } else if (this.chain === 'NULS') {
          let verifyInfo = {};
          try {
            verifyInfo = nerve.verifyAddress(this.transferForm.toAddress); //验证普通地址
            //console.log(verifyInfo);
          } catch (err) {
            console.log(err)
          }

          if (verifyInfo.chainId === 2 || verifyInfo.chainId === 1) {
            if (this.chooseAsset.contractAddress) {
              this.type = 16;
              if (verifyInfo.type === 1) { //token转账-transfe
                this.nulsType = 'tokenTransfer'
              } else if (this.chooseAsset.chain === 'NULS') { //向合约地址转nuls-_payable
                this.nulsType = 'nulsToContract'
              } else {
                console.log("暂不支持，接受地址为多签地址")
              }
            } else { //跨链资产 转账
              this.type = 2
            }
          } else if (verifyInfo.chainId === 5 || verifyInfo.chainId === 9) { //合约跨链
            if (this.chooseAsset.contractAddress) { //合约跨链
              this.nulsType = 'tokenCrossTransfer';
              this.type = 16;
            } else { //nuls 跨链
              this.type = 10;
            }
          } else {
            this.type = 2
          }
        } else {
          this.getHeterogeneousChain();
          this.getERC20Allowance();
        }
        //console.log(this.chooseAsset);
        this.transferForm.amount = '';
        if (this.transferForm.toAddress && this.transferForm.network) {
          this.changeAmount();
        }

      },

      /**
       * @disc: 资产数字改变
       * @date: 2021-02-04 15:04
       * @author: Wave
       */
      changeAmount() {
        //console.log(this.type, this.nulsType, this.transferForm, this.chain, this.chooseAsset, "changeAmount");
        if (!this.transferForm.toAddress || !this.transferForm.network) {
          return;
        }

        let difference = Minus(this.chooseAsset.balance, this.transferForm.amount).toFixed(5);
        //console.log(Number(difference));
        //console.log(Number(difference) < 0.01, this.feeList);
        if (this.chain === "NERVE" && this.type === 2) {
          this.feeList[0].fee = 0;
        }

        if (!this.transferForm.amount || Number(this.transferForm.amount) === 0) {
          this.amountTip = this.$t('tips.tip4')
        } else if (this.chain === this.chooseAsset.symbol && Number(difference) < 0.001) {
          this.amountTip = this.$t('tips.tip5') + Minus(this.chooseAsset.balance, 0.001).toString()
        } else if (Number(difference) < 0) {
          this.amountTip = this.$t('tips.tip5') + this.chooseAsset.balance.toString()
        } else {
          if (this.type === 16) {
            if (this.nulsType === 'nulsToContract') {
              this.validataContract("_payable");
            } else if (this.nulsType === 'tokenTransfer') {
              this.validataContract("transfer");
            } else if (this.nulsType === 'tokenCrossTransfer') {
              this.validataContract("transferCrossChain");
            }
          }
          this.amountTip = '';
          //this.changeAssets();
          if (this.transferForm.toAddress && this.transferForm.network) {
            this.getHeterogeneousChain();
            this.getERC20Allowance();
          }
        }
      },

      /**
       * @disc: 资产数字 限制
       * @param {string} value - 输入的值
       * @param {string} name - 匹配的对象属性 [mkPrice | slPrice]
       * @date: 2021-02-04 15:25
       * @author: Wave
       */
      limitInput(value, name) {
        let fixVal = this.chooseAsset.decimals;
        let reg = new RegExp('\\d*(\\.?\\d{0,' + fixVal + '})');
        let val = (value && value.split("")) || [];
        let reg1 = /\d/;
        let reg2 = /\./;
        // 第一个字符不能为小数点
        if (val[0] === ".") {
          this.transferForm[name] = "";
          return;
        }
        // 过滤掉除数字和小数点外的字符
        val = val.filter((e) => reg1.test(e) || reg2.test(e));
        // 匹配小数点后只能有两位小数
        // 解释一下这个match正则规格
        // ^\d* 是指以数字开头，后面允许输入0到多位数字
        // (\.?) 是指只允许一个小数点
        // \d{0,2} 是指只允许0到2位小数
        this.transferForm[name] = val.join("").match(reg)[0] || null;
      },

      /**
       * @disc: 选择所有
       * @params:
       * @date: 2021-02-04 15:40
       * @author: Wave
       */
      changeAll() {
        //console.log(this.type, this.chain, this.chooseAsset, this.feeList, this.feeType);
        if (this.chain === 'NERVE' && this.type === 2) {
          this.transferForm.amount = this.chooseAsset.balance;
        } else {
          this.transferForm.amount = this.chooseAsset.balance;
          if (this.feeType === "0") {
            for (let item of this.feeList) {
              if (this.chooseAsset.symbol === item.symbol) {
                this.transferForm.amount = Minus(this.chooseAsset.balance, item.fee).toString();
              }
            }
          } else {
            //console.log(this.chooseAsset);
            let fee = this.feeCross;
            if (this.feeType === "1") {
              fee = Times(this.feeCross, 0.8).toString()
            } else if (this.feeType === "3") {
              fee = Times(this.feeCross, 1.3).toString()
            }
            if (this.chooseAsset.symbol === this.chain) {
              this.transferForm.amount = Minus(this.chooseAsset.balance, fee).toString();
            }

          }
        }
        this.changeAmount();
      },

      /**
       * @disc: 选择手续费类型
       * @params:
       * @date: 2021-02-04 16:08
       * @author: Wave
       */
      changeFeeType() {
        if (this.feeType === '1') {
          this.gasPrice = this.multiplication(this.gasPriceOld, 0.8);
        } else if (this.feeType === '2') {
          if (this.chain === 'NERVE') {
            this.feeCross = this.gasPriceOld;
          }
          this.gasPrice = this.gasPriceOld;
        } else if (this.feeType === '3') {
          this.gasPrice = this.multiplication(this.gasPriceOld, 1.3);
          this.transferForm.amount = ''
        } else if (this.feeType === '4') {
          this.feeUsdt = Times(this.feeCross, this.assetPrice).toString()
        }
      },

      //获取资产的价格
      async getAssetPrice(chain) {
        const resData = await this.$request({url: "/asset/main/price", data: {chain: chain}});
        //console.log(resData);
        if (resData.code === 1000) {
          this.assetPrice = resData.data;
        } else {
          this.assetPrice = 0;
        }
      },

      // 获取跨链转入、跨链转出的异构链
      getHeterogeneousChain() {
        this.heterogeneousChain_In = {};
        this.heterogeneousChain_Out = {};
        //console.log(this.chooseAsset, 666);
        if (!this.chooseAsset.heterogeneousList) return;
        const heterogeneousChain_In = this.chooseAsset.heterogeneousList.filter(v => v.chainName === this.chain)[0];
        let chainName = this.transferForm.network === 'ERC20' ? 'Ethereum' : this.transferForm.network;
        const heterogeneousChain_Out = this.chooseAsset.heterogeneousList.filter(v => v.chainName === chainName)[0];
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

      // 计算nerve提现到eth bsc手续费
      async calculateFee() {
        this.feeLoading = true;
        const nvtUSD = await getSymbolUSD("NERVE");
        this.nvtUSD = nvtUSD + "";
        let chainName = this.transferForm.network === 'ERC20' ? 'Ethereum' : this.transferForm.network;
        const heterogeneousChainUSD = await getSymbolUSD(chainName);
        //异构链usd价格
        this.heterogeneousChainUSD = heterogeneousChainUSD + "";
        this.calWithdrawalNVTFee();
      },

      //获取默认手续费
      async calWithdrawalNVTFee() {
        const result = await this.eTransfer.calWithdrawalNVTFee(this.nvtUSD, this.heterogeneousChainUSD, this.heterogeneousChain_Out.token);
        const defaultFee = Number(divisionDecimals(result, this.MAIN_INFO.decimal));
        //console.log(defaultFee, "--defaultFee--");
        this.gasPriceOld = defaultFee;
        this.feeCross = defaultFee;
        this.feeCrossSysmol = 'NVT';
        this.feeType = '2';
        this.feeLoading = false;
      },

      //获取eth bnb 手续费（转账、跨入）
      async getGasPrice() {
        this.feeLoading = true;
        const gasLimit = this.chooseAsset.contractAddress ? "100000" : "35000";
        this.gasLimit = gasLimit;
        let result = await this.eTransfer.getGasPrice(gasLimit);
        this.gasPrice = Division(timesDecimals(result, 18).toString(), gasLimit).toString();
        this.gwei = divisionDecimals(this.gasPrice, 9).toString();
        this.gasPriceOld = this.gasPrice;
        this.feeCross = tofix(result, 5, 1);
        if (this.chain === 'Ethereum') {
          this.feeCrossSysmol = 'ETH';
        } else if (this.chain === 'BSC') {
          this.feeCrossSysmol = 'BNB';
        } else if (this.chain === 'Heco') {
          this.feeCrossSysmol = 'HT';
        } else if (this.chain === 'OKExChain') {
          this.feeCrossSysmol = 'OKT';
        }
        this.feeType = '2';
        this.feeLoading = false;
      },

      //默认手续费 --- eth
      async calWithdrawFee() {
        const result = await this.eTransfer.calWithdrawFee(this.heterogeneousChain_Out.token);
        this.feeCross = tofix(result, 5, 1);
        this.feeCrossSysmol = 'ETH';
        this.feeType = '2';
        this.feeLoading = false;
      },

      //查询erc20资产授权额度
      async getERC20Allowance() {
        let {contractAddress, heterogeneousChainMultySignAddress, token} = this.heterogeneousChain_In;
        contractAddress = this.chooseAsset.contractAddress ? this.chooseAsset.contractAddress : contractAddress;
        //console.log(this.heterogeneousChain_In, "异构转入链info");
        if (token) {
          this.needAllowance = true;
          this.refreshAllowance = true;
          this.isNext = true;
          this.needAllowance = await this.eTransfer.getERC20Allowance(contractAddress, heterogeneousChainMultySignAddress, this.transferForm.fromAddress);
          this.isNext = this.needAllowance;
          this.refreshAllowance = false;
        } else {
          this.isNext = false;
          this.needAllowance = false;
          this.refreshAllowance = false;
        }
      },

      //eth NRC20授权
      async approveERC20() {
        let {contractAddress, heterogeneousChainMultySignAddress} = this.heterogeneousChain_In;
        contractAddress = this.chooseAsset.contractAddress ? this.chooseAsset.contractAddress : contractAddress;
        const hex = await this.eTransfer.getApproveERC20Hex(contractAddress, heterogeneousChainMultySignAddress, this.transferForm.fromAddress);
        if (hex) {
          this.authorCross(hex)
        }
        //console.log(hex, "授权hex");
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

      //调用合约方法
      async validataContract(method) {
        this.feeLoading = true;
        this.isNext = true;
        const res = await getContractCallData(
          this.transferForm.fromAddress,
          this.transferForm.toAddress,
          this.transferForm.price,
          this.chooseAsset.contractAddress,
          method,
          this.transferForm.amount,
          this.chooseAsset.decimals
        );
        //console.log(res, "getContractCallData");
        if (res.success) {
          this.feeLoading = false;
          this.isNext = false;
          this.transferForm.fee = res.data.fee;
          this.feeList[0].fee = res.data.fee;
          this.transferForm.gas = res.data.gas;
          this.contractCallData = res.data.contractCallData;
        } else {
          this.$message({message: res.msg, type: "warning", duration: 3000});
        }
      },

      // 获取合约NRC20资产跨链交易gas
      async transferCrossChain() {
        const res = await getContractCallData(
          this.transferForm.fromAddress,
          this.transferForm.toAddress,
          this.transferForm.price,
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

      /**
       * @disc: 下一步
       * @params: formName
       * @date: 2021-02-01 11:56
       * @author: Wave
       */
      submitTransferForm(formName) {
        this.changeAmount();
        //console.log(this.type, this.transferForm, "8");
        this.$refs[formName].validate((valid) => {
          if (valid) {
            if (this.type === 10 && !this.transferForm.agree) {
              this.$message({type: "warning", message: this.$t('tips.tip14'), duration: 3000});
              return;
            }
            if (this.type === 0 && !this.transferForm.agreeTwo) {
              this.$message({type: "warning", message: this.$t('tips.tip14'), duration: 3000});
              return;
            }
            if (this.amountTip) {
              return;
            }
            this.showConfirm = true;
          } else {
            return false;
          }
        });
      },

      //转账确认 提交
      async submit() {
        this.transferLoading = true;
        let txHex = "";
        //console.log(this.chain);
        if (this.chain === "NULS" || this.chain === "NERVE") {
          const transfer = new NTransfer({chain: this.chain, network: this.$store.state.network, type: this.type});
          let transferInfo = {
            from: this.transferForm.fromAddress,
            to: this.transferForm.toAddress,
            assetsChainId: this.chooseAsset.chainId,
            assetsId: this.chooseAsset.assetId,
            amount: timesDecimals(this.transferForm.amount, this.chooseAsset.decimals),
            fee: timesDecimals(this.transferForm.fee, this.MAIN_INFO.decimal)
          };
          let txData = {};
          //console.log(transferInfo, this.type);
          if (this.type === 2) { //普通转账交易
            //console.log('普通转账交易');
            if (this.chain === "NERVE") {
              transferInfo.fee = 0
            } else {
              transferInfo.fee = timesDecimals(this.transferForm.fee, this.MAIN_INFO.decimal)
            }
            //console.log(transferInfo);
          } else if (this.type === 10) { //跨链转账
            transferInfo.fee = timesDecimals(0.01, this.MAIN_INFO.decimal);
            //console.log('跨链转账', transferInfo);
          } else if (this.type === 16) { //合约转账
            transferInfo.assetsChainId = this.MAIN_INFO.chainId;
            transferInfo.assetsId = this.MAIN_INFO.assetId;
            if (this.nulsType === "nulsToContract") {
              //向合约地址转nuls
              this.contractCallData.chainId = this.MAIN_INFO.chainId;
              transferInfo.toContractValue = transferInfo.amount;
              transferInfo.amount = Plus(transferInfo.fee, Times(this.transferForm.gas, this.transferForm.price)).toFixed();
              transferInfo.amount = Plus(transferInfo.amount, transferInfo.toContractValue).toFixed();
              txData = this.contractCallData || {};
            } else if (this.nulsType === "tokenTransfer") {
              // token转账 向合约地址转token
              transferInfo.amount = Plus(0, Times(this.transferForm.gas, this.transferForm.price)).toFixed();
              txData = this.contractCallData || {};
            } else if (this.nulsType === "tokenCrossTransfer") {  //nuls 合约token跨链
              transferInfo.amount = Plus(20000000, Times(this.transferForm.gas, this.transferForm.price)).toFixed();
              transferInfo.toContractValue = 10000000;
              transferInfo.to = this.chooseAsset.contractAddress;
              txData = this.contractCallData;
            }
            //console.log(transferInfo);
          } else if (this.type === 43) { // 跨链转出
            if (this.chooseAsset.contractAddress) {
              transferInfo.fromChain = this.chain;
              transferInfo.contractAddress = this.chooseAsset.contractAddress;
            }
            transferInfo.proposalPrice = timesDecimals(this.feeCross, this.MAIN_INFO.decimal);
            txData = {
              heterogeneousAddress: this.transferForm.toAddress,
              heterogeneousChainId: this.heterogeneousChain_Out.heterogeneousChainId
            };
          }
          const inputOuput = await transfer.inputsOrOutputs(transferInfo);
          try {
            txHex = await transfer.getTxHex({
              inputs: inputOuput.inputs,
              outputs: inputOuput.outputs,
              remarks: this.transferForm.remark.toString(),
              txData
            });
          } catch (e) {
            this.$message({type: "warning", message: this.$t('tips.tip6') + e, duration: 3000});
          }
        } else {
          if (this.feeType === '4') {
            this.gasPrice = timesDecimals(this.gwei, 9).toString()
          } else {
            this.gasLimit = this.chooseAsset.contractAddress ? "100000" : "35000";
          }
          //console.log(this.gasPrice,this.gasLimit,888888888888888888);
          if (this.type === 1) { //链内转账（ETH BSC Heco）
            //console.log('链内转账');
            try {
              txHex = await this.eTransfer.getTxHexTwo({
                to: this.transferForm.toAddress,
                value: this.transferForm.amount,
                gasPrice: this.gasPrice,
                gasLimit: this.gasLimit,
                contractAddress: this.chooseAsset.contractAddress,
                tokenDecimals: this.chooseAsset.decimals
              });
              console.log(txHex, "====eth 链内转账====")
            } catch (e) {
              console.error(this.$t('tips.tip7') + e);
              this.loading = false;
              this.$message({type: "warning", message: e, duration: 3000});
            }
          } else {
            // 跨链转入
            try {
              txHex = await this.eTransfer.getCrossInTxHexTwo({
                from: this.transferForm.fromAddress,
                to: this.transferForm.toAddress,
                value: this.transferForm.amount,
                gasPrice: this.gasPrice,
                gasLimit: this.gasLimit,
                multySignAddress: this.heterogeneousChain_In.heterogeneousChainMultySignAddress,
                contractAddress: this.chooseAsset.contractAddress ? this.chooseAsset.contractAddress : this.heterogeneousChain_In.contractAddress,
                tokenDecimals: this.chooseAsset.decimals
              });
            } catch (e) {
              //console.error(this.$t('tips.tip8') + e);
              this.$message({type: "warning", message: e, duration: 3000});
            }
          }
        }
        console.log(txHex, "====txHex====", this.type);
        if (txHex) {
          if (this.chain === "NULS" || this.chain === "NERVE" || this.type === 1) {
            await this.broadcastTx(txHex);
          } else {
            await this.broadcastTxCross(txHex);
          }
        } else {
          console.error("签名失败");
        }
        this.transferLoading = false;
      },

      //广播交易
      async broadcastTx(txHex) {
        const assetInfo = this.chooseAsset.contractAddress
          ? {contractAddress: this.chooseAsset.contractAddress}
          : {chainId: this.chooseAsset.chainId, assetId: this.chooseAsset.assetId};
        const params = {chain: this.chain, address: this.transferForm.fromAddress, txHex, ...assetInfo};
        const res = await this.$request({url: "/tx/transfer", method: "post", data: params});
        //console.log(res, "broadcastTx");
        this.loading = false;
        this.showConfirm = false;
        if (res.code === 1000) {
          this.$message({type: "success", message: this.$t("transfer.transfer13"), duration: 2000});
          setTimeout(() => {
            this.$router.push("/");
          }, 1500);
        } else {
          this.$message({type: "warning", message: res.msg ? res.msg : res.data, duration: 3000});
        }
      },

      //广播跨链转入交易
      async broadcastTxCross(txHex) {
        const assetInfo = this.chooseAsset.contractAddress
          ? {contractAddress: this.chooseAsset.contractAddress}
          : {chainId: this.chooseAsset.chainId, assetId: this.chooseAsset.assetId};
        const params = {
          fromChain: this.chain,
          toChain: this.transferForm.network === 'ERC20' ? 'Ethereum' : this.transferForm.network,
          fromAddress: this.transferForm.fromAddress,
          toAddress: this.transferForm.toAddress,
          txHex,
          ...assetInfo
        };
        //console.log(params);
        const res = await this.$request({url: "/tx/cross/transfer", method: "post", data: params});
        this.loading = false;
        this.showConfirm = false;
        if (res.code === 1000) {
          this.$message({type: "success", message: this.$t("transfer.transfer13"), duration: 2000});
          setTimeout(() => {
            this.$router.push("/");
          }, 1500);
        } else {
          this.$message({type: "warning", message: res.msg, duration: 3000});
        }
      }

    }
  };
</script>

<style lang="less">
  .cross-chain-transfer {
    .transfer-page {
      .transfer-form {
        margin: 16px 20px 0;
        .el-form-item {
          .el-form-item__label {
            font-size: 12px;
            color: #aab2c9;
            line-height: 15px;
            margin-bottom: 10px;
            display: block;
            float: none;
            text-align: left;
            &:before {
              display: none;
            }
          }
          .el-form-item__content {
            .el-input__inner {
              height: 44px;
              line-height: 44px;
              color: #3a3c44;
              font-size: 15px;
              //border-color: #bac0d3;
              &:focus {
                border-color: #DCDFE6;
              }
            }
            .network-list {
              .el-radio-button {
                padding: 0;
                margin: 0 5.5px 10px;
                height: 25px;
                min-width: 51px;
                background-color: #f1f2f7;
                border-color: #f1f2f7;
                border-radius: 3px;
                &:nth-child(5n) {
                  margin: 0 0 5.5px 10px;
                }
                .el-radio-button__inner {
                  font-size: 12px;
                  color: #8f95a8;
                  padding: 0 5px;
                  line-height: 25px;
                  border-radius: 3px;
                  border: 0;
                  text-align: center;
                  background-color: #f1f2f7;
                  display: block;
                  height: 23px;
                }
              }
              .is-active {
                border: 1px solid #49cdba;
                height: 25px;
                .el-radio-button__inner {
                  color: #49cdba;
                  background-color: #fff;
                  height: 23px;
                  padding: 0 5px;
                }
              }
            }
            .input-with-select {
              .el-input-group__prepend {
                background-color: #fff;
                border-right: 0;
                .el-select {
                  width: 88px;
                  .el-input {
                    .el-input__suffix {
                      margin: 10px -3px 0 0;
                      &:focus {
                        border-right: 0;
                      }
                    }
                  }
                  .is-focus {
                    .el-input__inner {
                      border-right: 0;
                    }
                  }
                }
              }
              .el-input__inner {

              }
              .el-input__suffix {
                margin: 10px 5px 0 0;
                height: 30px;
                .all {
                  font-size: 12px;
                  color: #3a3c44;
                }
              }
            }
            .fee-list {
              .el-radio-button {
                .el-radio-button__inner {
                  padding: 5px 5px;
                  width: 85px;
                  height: 40px;
                  h5 {
                    font-size: 12px;
                    color: #8f95a8;
                  }
                  p {
                    font-size: 8px;
                    color: #bac0d3;
                    margin: 4px 0 0 0;
                  }
                }
              }
              .is-active {
                .el-radio-button__inner {
                  h5 {
                    color: #fff;
                  }
                  p {
                    color: #d4efea;
                  }
                }
              }
              .custom {
                .el-radio-button__inner {
                  width: 55px;
                }
              }
            }
            .custom-info {
              padding: 10px 0 10px 0;
              background-color: #f6fbfb;
              p {
                font-size: 12px;
                line-height: 25px;
              }
              .el-input {
                width: 140px;
                .el-input__inner {
                  width: 140px;
                  line-height: 40px;
                  height: 40px;
                }
              }
              .gas, .limit {
                margin: 0 5px;
              }
              .nvt-fee {
                width: 100%;
                padding: 0 4px;
                .el-input {
                  .el-input__inner {
                    width: 300px;
                  }
                }
              }
              .num {
                text-align: right;
                font-size: 12px;
                line-height: 25px;
                margin: 0 5px 0 0;
              }

            }
          }
        }

        .approve-tip {
          margin-bottom: 15px;
        }
        .network {
          margin-bottom: 5px;
        }
        .amount {
          .el-form-item__content {
            .el-input__inner {
              border-left: 0;
            }
          }
        }
        .is-errors {
          .el-form-item__content {
            .el-input__inner {
              border-color: #F56C6C;
              &:focus {
                border-color: #F56C6C;
              }
            }
            .input-with-select {
              .el-input-group__prepend {
                .el-input__inner {
                  border: 1px solid #F56C6C;
                  border-right: 0;
                  border-bottom-left-radius: 4px;
                  border-bottom-right-radius: 0;
                  border-top-right-radius: 0;
                  border-top-left-radius: 4px;
                }
              }
            }
          }
        }
        .fee-div {
          margin-bottom: 20px;
          .el-form-item__label {
          }
          .el-form-item__content {
            .input-with-select {
              width: 270px;
              .el-input-group__append {
                .unit {
                }
                .cancel {
                  display: block;
                  float: right;
                }
                .confirm {
                  display: block;
                  float: right;
                }
              }
            }
          }
        }
        .agree {
          margin: 0 0 0 0;
          .el-form-item__label {
            line-height: 0;
            margin: 0;
            padding: 0;
          }
          .el-form-item__content {
            line-height: 20px;
            .el-checkbox {
              .all_label {
                display: inline-grid;
                white-space: pre-line;
                word-wrap: break-word;
                overflow: hidden;
                width: 290px;
              }
            }
          }
        }
        .transfer-form-btn {
          margin-top: 20px;
          .el-form-item__content {
            text-align: center;
            .el-button {
              width: 300px;
              height: 44px;
              span {
                font-size: 12px;
                color: #ffffff;
              }
            }
          }
        }
        .network {
          margin-bottom: 5px;
          .el-form-item__label {
            margin-bottom: 5px;
            display: block;
            float: none;
            text-align: left;
          }
        }
      }
    }
  }
</style>

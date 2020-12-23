<template>
  <div class="inner-transfer">
    <transition name="fade-transform" mode="out-in">
      <div v-show="!showConfirm">
        <common-head>
          {{ $t("innerTransfer.innerTransfer1") }}
          <template v-slot:right>
            <i class="el-icon-document"></i>
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
                <el-select v-model="fromNetwork" @change="changeFromNetwork">
                  <el-option
                    v-for="item in networkList"
                    :key="item"
                    :label="item"
                    :value="item"
                  ></el-option>
                </el-select>
                <span class="address">{{ superLong(fromAddress) }}</span>
              </div>
              <div class="to">
                <el-select v-model="toNetwork">
                  <el-option
                    v-for="item in networkList"
                    :key="item"
                    :label="item"
                    :value="item"
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
          >
            <el-form-item :label="$t('public.symbol')">
              <el-select v-model="transferModal.symbol">
                <el-option label="区域一" value="shanghai"></el-option>
                <el-option label="区域二" value="beijing"></el-option>
              </el-select>
            </el-form-item>
            <span class="available">
              {{ $t("public.available") + ": " }}132465.77
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
              0.01NULS
            </div>
            <el-button class="btn" type="primary" @click="showConfirm = true">
              {{ $t("public.next") }}
            </el-button>
          </el-form>
        </div>
      </div>
    </transition>

    <transfer-confirm
      :data="confirmData"
      :visiable.sync="showConfirm"
    ></transfer-confirm>
  </div>
</template>

<script>
import CommonHead from "@/components/CommonHead";
import TransferConfirm from "@/components/TransferConfirm";
import { superLong } from "@/utils/util";
export default {
  data() {
    const validateAmount = (rule, value, callback) => {
      //console.log(this.changeAssetInfo);
      if (value === "") {
        callback(new Error("请输入数量"));
      } else {
        callback();
      }
    };
    return {
      account: {},
      networkList: [],
      fromNetwork: "NULS",
      fromAddress: "",
      toNetwork: "NERVE",
      toAddress: "",
      transferModal: {
        symbol: "NULS",
        amount: "",
        remarks: ""
      },
      transferRules: {
        amount: [{ validator: validateAmount, trigger: ["blur", "change"] }]
      },
      fee: 0.01,
      showConfirm: false
    };
  },

  components: {
    CommonHead,
    TransferConfirm
  },

  watch: {
    fromNetwork: {
      immediate: true,
      handler(val, old) {
        if (val === this.toNetwork) {
          this.toNetwork = old;
        }
        const account = { ...this.$store.getters.currentAccount[this.network] };
        this.fromAddress = account[val];
      }
    },
    toNetwork: {
      immediate: true,
      handler(val, old) {
        if (val === this.fromNetwork) {
          this.fromNetwork = old;
        }
        const account = { ...this.$store.getters.currentAccount[this.network] };
        this.toAddress = account[val];
      }
    }
  },

  computed: {
    confirmData() {
      return {
        from: superLong(this.fromAddress, 12),
        to: superLong(this.toAddress, 12),
        amount: this.transferModal.amount,
        fee: this.fee,
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
    let networkList = [];
    /* Object.keys(account).map(key => {
      networkList.push(network);
    }); */
    const sortOrder = ["NULS", "NERVE", "Ethereum", "BSC"];
    function indexOf(item) {
      return sortOrder.indexOf(item);
    }
    this.networkList = Object.keys(account).sort((a, b) => {
      return indexOf(a) - indexOf(b);
    });
  },

  methods: {
    superLong(str, len = 8) {
      return superLong(str, len);
    },
    changeFromNetwork(val) {
      // this.fromNetwork = val + this.superLong(this.address);
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
    .btn {
      width: 100%;
      margin-top: 20px;
    }
  }
}
</style>

<template>
  <div class="authorization" v-loading="loading">
    <div class="logo-wrap tc">
      <img src="../../assets/img/logo.svg" alt="" />
    </div>
    <div class="select-account">
      <h3 class="tc">{{ $t("authorization.authorization1") }}</h3>
      <div class="list">
        <ul>
          <li
            v-for="item in accountList"
            :key="item.id"
            @click="handleClick(item)"
          >
            <el-checkbox v-model="item.selection"></el-checkbox>
            <span>{{ item.name }}</span>
            <span>${{ item.balance }}</span>
          </li>
        </ul>
      </div>
    </div>
    <div class="tip">
      {{ $t("authorization.authorization2") }}
      <p>{{ $t("authorization.authorization3") }}</p>
    </div>
    <div class="btn-wrap">
      <el-button>{{ $t("public.cancel") }}</el-button>
      <el-button type="primary" @click="connect">{{ $t("authorization.authorization4") }}</el-button>
    </div>
  </div>
</template>

<script>
import ExtensionPlatform from "@/utils/extension";
export default {
  data() {
    return {
      loading: true,
      accountList: []
    };
  },

  components: {},

  watch: {},

  computed: {},

  created() {},

  async mounted() {
    const { accountList, network } = this.$store.state;
    const list = [];
    accountList.map(v => {
      list.push({
        name: v.name,
        balance: v["balance_" + network],
        selection: v.selection,
        id: v.id,
        beta: v.beta,
        main: v.main
      });
    });
    this.accountList = list;
    this.loading = false;
  },

  methods: {
    handleClick(item) {
      const list = [...this.accountList];
      list.map(v => {
        if (v.id === item.id) {
          v.selection = !item.selection;
        }
      });
      this.accountList = list;
    },
    async connect() {
      /* const bg = chrome.extension.getBackgroundPage();
      console.log(bg,99999) */
      /* bg.sendMessageToContentScript({
            type: "authorization",
            data: "选择的账户信息"
          }) */
      const origin = (await ExtensionPlatform.get("invokeOrigin")).invokeOrigin;
      const allowSites = (await ExtensionPlatform.get("allowSites")).allowSites || [];
      allowSites.push({
        origin,
        network: this.$store.state.network,
        address: this.accountList[0]
      });
      await ExtensionPlatform.set({ allowSites });
      /* chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        console.log(tabs, 666);
        // chrome.tabs.connect(tabs[0].id, {name: "auth"})
        chrome.tabs.sendMessage(tabs[0].id,{
            type: "authorization",
            data: "选择的账户信息"
          },
          function(response) {
            console.log(response, "====response====");
          }
        );
      }); */
    }
  }
};
</script>
<style lang="less">
.authorization {
  font-size: 12px;
  padding-top: 50px;
  h3 {
    margin: 20px 0;
  }
  .select-account {
    .list {
      width: 80%;
      margin: auto;
      border: 1px solid #d0d5da;
      border-radius: 12px;
      overflow: hidden;
    }
    ul {
      overflow: auto;
      max-height: 200px;
      &::-webkit-scrollbar {
        width: 3px;
        height: 3px;
      }
      &:hover::-webkit-scrollbar-thumb {
        background: #d8d8d8;
      }
    }
    li {
      border-bottom: 1px solid #d2d8dd;
      padding: 16px 10px;
      span {
        margin: 0 5px;
      }
      &:hover {
        background: #f2f3f4;
        cursor: pointer;
      }
      &:last-child {
        border-bottom: none;
      }
    }
  }
  .tip {
    padding-left: 10%;
    padding-top: 20px;
    font-size: 14px;
    color: #7F7F7F;
    p {
      color: #3a3c44;
      font-size: 12px;
      &::before {
        content: "";
        display: inline-block;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background-color: #3a3c44;
        vertical-align: middle;
        margin-right: 5px;
      }
    }
  }
  .btn-wrap {
    text-align: center;
    margin-top: 35px;
    .el-button {
      height: 35px;
      border-radius: 5px;
      font-size: 12px;
      padding: 12px 40px;
      &+.el-button {
        margin-left: 20px;
      }
    }
  }
}
</style>

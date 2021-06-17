<template>
  <div class="authorization">
    <div class="from-wrap">
      <div class="from-logo">
        <img v-if="siteInfo.icon" :src="siteInfo.icon"/>
        <i v-else>C</i>
      </div>
      <p class="from-origin">
        {{ siteInfo.domain }}
      </p>
    </div>
    <div class="select-account">
      <h3 class="tc">{{ $t("authorization.authorization1") }}</h3>
    </div>
    <div class="network-list">
      <h3>
        <!-- {{ $t("authorization.authorization7") }}
        <br/> -->
        {{ superLong(accountInfo.address) }}
      </h3>
      <p class="plugin-chain-info">{{ $t("authorization.authorization6") + chainInfo.chain + " - " +chainInfo.network }}</p>
    </div>
    <div class="btn-wrap">
      <el-button @click="reject">{{ $t("public.cancel") }}</el-button>
      <el-button type="primary" @click="connect">
        {{ $t("authorization.authorization4") }}
      </el-button>
    </div>
  </div>
</template>

<script>
  import { getStorage, superLong } from "@/utils/util";
  import ExtensionPlatform from "@/utils/extension";

  export default {
    data() {
      return {
        siteInfo: this.$route.query,
        chainInfo: {},
        accountInfo: {}
      };
    },

    components: {},

    watch: {},

    computed: {},

    created() {
    },

    async mounted() {
      // console.log(this.siteInfo, 6655)
      if (!this.siteInfo || !this.siteInfo.domain) {
        this.$message({ message: "unknown error", type: "warning", duration: 1000 });
        this.close();
        return;
      }
      
      const nabox = await getStorage("nabox", {});
      this.chainInfo = {
        chain: nabox.chain || "Ethereum",
        network: nabox.network || "main"
      }
      const currentAccount = this.$store.getters.currentAccount;
      this.accountInfo = {
        address: currentAccount[this.chainInfo.network][this.chainInfo.chain],
        accountId: currentAccount.id
      }
    },

    methods: {
      superLong(str, len = 12) {
        return superLong(str, len)
      },
      close() {
        this.$router.go(-1);
      },

      reject() {
        this.close();
      },

      async connect() {
        const nabox = await getStorage("nabox", {});
        const { allowSites = [], chain, network, chainId } = nabox;
        const existIndex = allowSites.findIndex(v => v.origin === this.siteInfo.domain)
        if (existIndex > -1) {
          const approvedList = allowSites[existIndex].approvedList || [];
          const exist = approvedList.findIndex(v => v.address === this.accountInfo.address);
          if (exist > -1){
            this.close();
            return;
          }
          allowSites[existIndex].approvedList.push(this.accountInfo)
        } else {
          allowSites.push({
            origin: this.siteInfo.domain,
            // chain,
            // network,
            approvedList: [this.accountInfo],
            // chainId,
          });
        }
        nabox.allowSites = allowSites;
        // nabox.allowSites = []
        await ExtensionPlatform.set({nabox});
        this.close();
      }
    }
  };
</script>
<style lang="less">
  .authorization {
    padding-top: 100px;
    .from-wrap {
      display: flex;
      align-items: center;
      flex-direction: column;
      .from-origin {
        font-size: 14px;
        color: #6a737d;
        margin: 20px 0 30px;
        padding: 0 80px;
        text-align: center;
      }
    }
    .from-logo {
      border-radius: 50%;
      border: 1px solid #f2f3f4;
      background: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 64px;
      height: 64px;
      img {
        width: 48px;
        height: 48px;
      }
      i {
        color: #000;
        font-style: normal;
      }
    }
    .select-account h3 {
      margin-bottom: 10px;
      font-size: 14px;
    }
    .network-list {
      margin-left: 30px;
      h3 {
        margin-bottom: 5px;
        font-size: 14px;
      }
      .el-radio {
        display: block;
      }
    }
    .plugin-chain-info {
      font-weight: 600;
      line-height: 40px;
    }
    .btn-wrap {
      text-align: center;
      margin-top: 70px;
      .el-button {
        height: 35px;
        border-radius: 5px;
        font-size: 12px;
        padding: 12px 0px;
        width: 120px;
        & + .el-button {
          margin-left: 20px;
        }
      }
    }
  }
</style>

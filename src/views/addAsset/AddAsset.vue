<template>
  <div class="add-asset">
    <common-head>{{ $t("addAsset.addAsset1") }}</common-head>
    <div class="content" v-loading="loading">
      <el-input v-model="searchVal" :placeholder="placeholderInfo" @input="searchAsset">
      </el-input>
      <ul>
        <li v-for="item in assetsList" :key="getKey(item)">
          <el-image class="fl" :src="'https://nuls-cf.oss-us-west-1.aliyuncs.com/icon/'+item.symbol+'.png'">
          <span slot="error" class="image-slot">
            <!--<i class="el-icon-picture-outline"></i>-->
            <img width="26" src="https://scan.nerve.network/dist/img/commonIcon.bbc291f8.png">
          </span>
          </el-image>

          <div class="asset-info">
            <p>
              {{ item.symbol }}
              <span v-show="item.registerChain" style="font-size: 12px;color: #bac0d3;">({{item.registerChain}})</span>
            </p>
            <span class="clicks" @click="copy(item.contractAddress)">{{ superLong(item.contractAddress) }}</span>
          </div>
          <el-checkbox v-model="item.select"
                       @change="focusAsset(item)"
                       :disabled="item.configType === 1 || item.configType === 2">
          </el-checkbox>
        </li>
      </ul>
      <div class="tc">
        <el-button v-show="assetsList.length" type="primary" @click="submit">
          {{ $t("public.confirm") }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
  import CommonHead from "@/components/CommonHead";
  import {superLong, copys} from "@/utils/util";

  export default {
    data() {
      return {
        searchVal: "",
        assetsList: [],
        loading: false,
        placeholderInfo: '',
      };
    },

    components: {
      CommonHead
    },

    computed: {},

    created() {
      //console.log(this.$route.query.chain);
      if (this.$route.query.chain === 'NERVE') {
        this.placeholderInfo = this.$t('addAsset.addAsset3')
      } else {
        this.placeholderInfo = this.$t('addAsset.addAsset2')
      }
      const visibleAssets = JSON.parse(sessionStorage.getItem("visibleAssets"));
      visibleAssets.map(v => {
        v.select = true;
      });
      this.selectedAssets = visibleAssets;
      this.assetsList = visibleAssets;
      //console.log(this.assetsList)
      //https://nuls-cf.oss-us-west-1.aliyuncs.com/icon/NULS.png
    },
    beforeDestroy() {
      sessionStorage.removeItem("visibleAssets");
    },

    methods: {

      superLong(str, len = 10) {
        return superLong(str, len);
      },

      getKey(item) {
        return item.contractAddress ? item.contractAddress : item.chainId + "-" + item.assetId;
      },

      async searchAsset() {
        this.loading = true;
        const res = await this.$request({
          url: "/asset/query",
          data: {chain: this.$route.query.chain, searchKey: this.searchVal}
        });
        if (res.code === 1000) {
          res.data.map(v => {
            const exit = this.selectedAssets.filter(item => {
              if (item.contractAddress) {
                return item.contractAddress === v.contractAddress;
              } else {
                return item.chainId === v.chainId && item.assetId === v.assetId;
              }
            }).length;
            if (exit) {
              v.select = true;
            } else {
              v.select = false;
            }
          });
          this.assetsList = res.data;
        }
        this.loading = false;
      },

      async focusAsset(item) {
        const {chain, address} = this.$route.query;
        const assetInfo = {contractAddress: item.contractAddress, chainId: item.chainId, assetId: item.assetId};
        let newData = {chain, address, focus: item.select, ...assetInfo};
        //console.log(newData);
        const res = await this.$request({url: "/wallet/address/asset/focus", data: newData});
        //console.log(res);
        if (res.code !== 1000) {
          this.$message({type: "warning", message: res.data});
        }
      },

      submit() {
        this.$router.back();
      },

      /**
       * @disc: 复制功能
       * @params:
       * @date: 2021-03-04 14:19
       * @author: Wave
       */
      copy(str) {
        copys(str);
        this.$message({message: this.$t("public.copySuccess"), type: "success", duration: 1000});
      },

    }
  };
</script>
<style lang="less">
  .add-asset {
    .content {
      padding: 10px 25px 0;
    }
    .el-input {
      input {
        height: 32px;
        line-height: 32px;
      }
    }
    ul li {
      display: flex;
      align-items: center;
      height: 62px;
      border-bottom: 1px solid #e9ebf3;
      .el-image {
        width: 32px;
        height: 32px;
        margin-right: 20px;
        i {
          font-size: 34px;
        }
      }

      .asset-info {
        flex: 1;
      }
      &:hover {
        .clicks {
          background-color: #DCDFE6;
        }
      }
      &:last-child {
        border-bottom: none;
      }
    }
    .el-button {
      width: 60%;
      margin-top: 20px;
    }
  }
</style>

<template>
  <div class="add-asset">
    <common-head>{{ $t("addAsset.addAsset1") }}</common-head>
    <div class="content" v-loading="loading">
      <el-input v-model="searchVal" :placeholder="$t('addAsset.addAsset2')" @change="searchAsset">
      </el-input>
      <ul>
        <li v-for="item in assetsList" :key="getKey(item)">
          <!--<img :src="item.icon"/>-->
          <el-image :src="item.icon">
          <span slot="error" class="image-slot">
            <i class="el-icon-picture-outline"></i>
          </span>
          </el-image>

          <div class="asset-info">
            <p>{{ item.symbol }}</p>
            <span>{{ superLong(item.contractAddress) }}</span>
          </div>
          <el-checkbox v-model="item.select" @change="focusAsset(item)"
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
  import {superLong} from "@/utils/util";

  export default {
    data() {
      return {
        searchVal: "",
        assetsList: [],
        loading: false
      };
    },

    components: {
      CommonHead
    },

    computed: {},

    created() {
      const visibleAssets = JSON.parse(sessionStorage.getItem("visibleAssets"));
      visibleAssets.map(v => {
        v.select = true;
      });
      this.selectedAssets = visibleAssets;
      this.assetsList = visibleAssets;
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
        const assetInfo = item.contractAddress ?
          {contractAddress: item.contractAddress} : {chainId: item.chainId, assetId: item.assetId};
        let newData = {chain, address, focus: item.select, ...assetInfo};
        //console.log(newData);
        const res = await this.$request({url: "/wallet/address/asset/focus", data: newData});
        //console.log(res);
        if (res.code !== 1000) {
          this.$message({type: "error", message: res.data});
        }
      },

      submit() {
        this.$router.back();
      }

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
        // background-color: #f2f3f4;
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

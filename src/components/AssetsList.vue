<template>
  <div class="asset-list">
    <div class="li" v-for="(item,index) in list" :key="index" @click="handleClick(item)">
      <div class="asset-title fl">
        <el-image class="fl" :src="'https://nuls-cf.oss-us-west-1.aliyuncs.com/icon/'+item.symbol+'.png'">
          <span slot="error" class="image-slot">
            <!--<i class="el-icon-picture-outline"></i>-->
            <img width="26" src="https://scan.nerve.network/dist/img/commonIcon.bbc291f8.png">
          </span>
        </el-image>
        <div class="symbol fl">{{ item.symbol }}<span v-show="item.registerChain">({{item.registerChain}})</span></div>
      </div>
      <div class="asset-info fr">
        <p>{{ item.total }}</p>
        <h6>≈${{ item.usdPrice }}</h6>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      list: {
        type: Array,
        default: () => []
      }
    },
    created() {
      //console.log(this.list, "assets-list");
    },
    methods: {

      getKey(item) {
        return item.contractAddress ? item.contractAddress : item.chainId + "-" + item.assetId;
      },

      handleClick(info) {
        this.$emit("toDetail", info);
      }
    }
  };
</script>

<style lang="less" scoped>
  .asset-list {
    overflow-x: auto;
    .li {
      align-items: center;
      height: 65px;
      cursor: pointer;
      clear: both;
      border-bottom: 1px solid #e9ebf3;
      .asset-title {
        margin: 18px 0 0 0;
        .el-image {
          width: 36px;
          padding: 0 0.5rem 0 0;
          .el-image__inner {

          }
          .el-icon-picture-outline {
            font-size: 26px;
          }
        }
        .symbol {
          margin: 6px 0 0 0;
          font-size: 15px;
          font-weight: 500;
          color: #8F95A8;
          line-height: 18px;
          span {
            font-size: 12px;
            color: #bac0d3;
          }
        }
      }

      .asset-info {
        margin: 15px 0 0 0;
        text-align: right;
        p {
          font-size: 15px;
          font-weight: 500;
          color: #3A3C44;
          line-height: 18px;
        }
        h6 {
          color: #AAB2C9;
          font-size: 12px;
          font-weight: 500;
          line-height: 18px;
        }
      }
      &:hover {
        //background-color: #f2f3f4;
      }
    }
  }
</style>

<template>
  <div class="asset-list">
    <ul>
      <li v-for="item in list" :key="getKey(item)" @click="handleClick(item)">
        <img :src="item.icon" />
        <div class="asset-info">
          <p>{{ item.total }} {{ item.symbol }}</p>
          <span>≈${{ item.usdPrice }}</span>
        </div>
        <i class="el-icon-arrow-right"></i>
      </li>
    </ul>
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

  methods: {
    getKey(item) {
      return item.contractAddress
        ? item.contractAddress
        : item.chainId + "-" + item.assetId;
    },
    handleClick(info) {
      this.$emit("toDetail", info);
    }
  }
};
</script>
<style lang="less" scoped>
.asset-list {
  ul {
    overflow: auto;
    height: 100%;
    // padding-bottom: 10px;
  }
  li {
    display: flex;
    align-items: center;
    height: 62px;
    cursor: pointer;
    border-bottom: 1px solid #e9ebf3;
    img {
      width: 32px;
      margin-right: 22px;
    }
    .asset-info {
      flex: 1;
      margin-top: 2px;
      p {
        color: #3a3c44;
        line-height: 1;
      }
      span {
        color: #6d757c;
        font-size: 13px;
      }
    }
    i {
      color: #bac0d3;
      font-size: 22px;
      font-weight: 600;
    }
    &:hover {
      background-color: #f2f3f4;
    }
    &:last-child {
      border-bottom: none;
    }
  }
}
</style>

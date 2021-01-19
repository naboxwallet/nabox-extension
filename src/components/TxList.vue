<template>
  <div class="tx-list">
    <ul class="list" v-infinite-scroll="load" infinite-scroll-disabled="disabled">
      <li v-for="item in list" :key="item.id" @click="handleClick(item)">
        <div class="top clear">
          <span class="asset-symbol">{{ item.symbol }}</span>
          <span class="time">{{ item.createTime }}</span>
          <i class="el-icon-arrow-right fr"></i>
        </div>
        <div class="bottom">
          <div v-if="item.froms">
            <p>From</p>
            {{ superLong(item.froms) }}
          </div>
          <div v-if="item.tos">
            <p>To</p>
            {{ superLong(item.tos) }}
          </div>
          <div :class="item.transType > 0 ? 'up' : 'down'">
            <p>&nbsp;</p>
            {{ item.transType > 0 ? "+" + item.amount : "-" + item.amount }}
          </div>
        </div>
      </li>
    </ul>
    <p class="load-tip" v-if="loading">加载中...</p>
    <p class="load-tip" v-if="noMore">没有更多了</p>
  </div>
</template>

<script>
  import {superLong} from "@/utils/util";

  export default {
    props: {
      list: {
        type: Array,
        default: () => []
      },
      loading: {
        type: Boolean,
        default: true
      },
      total: [String, Number]
    },
    computed: {
      noMore() {
        return this.list.length && this.list.length >= this.total;
      },
      disabled() {
        return this.loading || this.noMore;
      }
    },
    methods: {
      superLong(str, len = 5) {
        return superLong(str, len);
      },
      handleClick(item) {
        this.$emit("toDetail", item);
      },
      load() {
        this.$emit("loadMoreTx");
      }
    }
  }

</script>
<style lang="less" scoped>
  .tx-list {
    overflow: auto;
    height: 100%;
    li {
      height: 74px;
      padding: 12px 0;
      cursor: pointer;
      border-bottom: 1px solid #e9ebf3;
      &:hover {
        background-color: #f2f3f4;
      }
      &:last-child {
        border-bottom: none;
      }
      .top {
        .asset-symbol {
          color: #3a3c44;
          margin-right: 10px;
        }
        .time {
          color: #6d757c;
          font-size: 12px;
        }
        i {
          color: #bac0d3;
          font-size: 20px;
          font-weight: 600;
        }
      }
      .bottom {
        // display: flex;
        overflow: hidden;
        div {
          margin-right: 5px;
          font-size: 12px;
          float: left;
          &:last-child {
            // flex: 1;
            float: right;
            font-size: 14px;
            line-height: 14px;
            color: #fd775a;
            text-align: right;
          }
          &.up {
            color: #53b8a9;
          }
        }
        p {
          color: #a5abb2;
          height: 15px;
        }
      }
    }
    .load-tip {
      color: #53b8a9;
      font-size: 12px;
      text-align: center;
    }
  }
</style>

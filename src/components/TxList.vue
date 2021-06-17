<template>
  <div class="tx-list">
    <ul class="list" v-infinite-scroll="load" infinite-scroll-disabled="disabled">
      <li v-for="(item,index) in oldList" :key="index" @click="handleClick(item)">
        <div class="top clear">
          <span class="asset-symbol">{{ item.symbol }}</span>
          <span class="time">{{ item.createTime }}</span>
          <!-- <i class="el-icon-arrow-right fr"></i>-->
          <label class="amount" :class="item.transType > 0 ? 'up' : 'down'">{{ item.transType > 0 ? "+" +
            parseFloat(item.amount) : "-" + parseFloat(item.amount) }}</label>
        </div>
        <div class="bottom">
          <div v-if="item.froms" style="margin-right: 20px">
            <p>From</p>
            {{ superLong(item.froms) }}
          </div>
          <div v-if="item.tos">
            <p>To</p>
            {{ superLong(item.tos) }}
          </div>

          <div class="fr state">
            <i v-if="item.status ===1" class="el-icon-success"></i>
            <i v-else class="el-icon-loading"></i>
            <!-- <svg v-else xmlns="http://www.w3.org/2000/svg" version="1.1">
                <rect x="12" y="20" width="4" height="10" style="fill:#49c7b5;transform:skewX(160deg);">
                  <animate attributeType="CSS" attributeName="opacity" from="1" to="0" dur="0.75s" repeatCount="indefinite" />
                </rect>
                <rect x="28" y="20" width="4" height="10" style="fill:#49c7b5;transform:skewX(160deg);">
                  <animate attributeType="CSS" attributeName="opacity" from="1" to="0" dur="1.51s" repeatCount="indefinite" />
                </rect>
                <rect x="20" y="20" width="4" height="10" style="fill:#49c7b5;transform:skewX(160deg);">
                  <animate attributeType="CSS" attributeName="opacity" from="1" to="0" dur="2.72s" repeatCount="indefinite" />
                </rect>
              </svg>-->
          </div>

          <!--<div :class="item.transType > 0 ? 'up' : 'down'">
            <p>&nbsp;</p>
            {{ item.transType > 0 ? "+" + parseFloat(item.amount) : "-" + parseFloat(item.amount) }}
          </div>-->
        </div>
      </li>
    </ul>
    <p class="load-tip" v-if="loading">{{$t('public.loading')}}...</p>
    <p class="load-tip" v-if="noMore">{{$t('public.noMore')}}</p>
  </div>
</template>

<script>
  import {superLong, tofix} from "@/utils/util";

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
    data() {
      return {
        oldList: [],
      }
    },
    computed: {
      noMore() {
        return this.list.length && this.list.length >= this.total;
      },
      disabled() {
        return this.loading || this.noMore;
      }
    },
    watch: {
      "list": function (val) {
        //console.log(val);
        if (val.length !== 0) {
          for (let item of val) {
            item.amount = tofix(item.amount, 6, 1)
          }
          if (this.oldList.length !== 0 && this.oldList[0].chainInfo === val[0].chainInfo) {
            this.oldList = [...this.oldList, ...val];
          } else {
            this.oldList = val;
          }
        } else {
          this.oldList = [];
        }
        //console.log(this.oldList);
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
      height: 82px;
      padding: 12px 0;
      cursor: pointer;
      border-bottom: 1px solid #E9EBF3;
      .top {
        height: 25px;
        .asset-symbol {
          margin-right: 10px;
          font-size: 15px;
          font-family: DINOT;
          font-weight: 500;
          color: #3A3C44;
          line-height: 18px;
        }
        .time {
          font-size: 12px;
          font-family: DINOT;
          font-weight: 500;
          color: #AAB2C9;
          line-height: 18px;
        }
        i {
          color: #bac0d3;
          font-size: 20px;
          font-weight: 600;
        }
        .amount {
          float: right;
          text-align: right;
          height: 14px;
          font-size: 18px;
          font-family: DINOT;
          font-weight: 500;
          color: #53B8A9;
          line-height: 18px;
        }
        .up {
          color: #53b8a9;
        }
        .down {
          color: #fd775a;
        }
      }
      .bottom {
        // display: flex;
        overflow: hidden;
        div {
          margin-right: 5px;
          float: left;
          font-size: 12px;
          font-family: DINOT;
          font-weight: 500;
          color: #8F95A8;
        }
        p {
          color: #a5abb2;
          height: 15px;
        }

        .state {
          float: right;
          i {
            color: #49C7B5;
            font-size: 15px;
            margin: 15px 0 0 0;
          }
        }
      }
    }
    .load-tip {
      color: #53b8a9;
      font-size: 12px;
      text-align: center;
      margin-top: 10px;
    }
  }
</style>

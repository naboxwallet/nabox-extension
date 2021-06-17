<template>
  <transition name="modal-transform">
    <div v-show="visiable" class="overview-modal">
      <div class="mask" @click="hide"></div>
      <div class="modal-content shadow">
        <h3>{{ $t("home.home12") }}</h3>
        <div class="content">
          <div class="head">
            <span>{{ $t("public.chain") }}</span>
            <span>{{ $t("public.amount") }}</span>
            <span>{{ $t("public.percent") }}</span>
          </div>
          <div class="info">
            <div class="info-item" v-for="(item, index) in list" :key="index">
              <span>{{ item.symbol }}</span>
              <span>{{ item.amount }}</span>
              <span>{{ item.percent }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
  export default {
    data() {
      return {};
    },
    props: {
      visiable: Boolean,
      list: {
        type: Array,
        default: () => []
      }
    },

    created() {
    },

    mounted() {
    },
    beforeDestroy() {
    },
    methods: {

      hide() {
        this.$emit("update:visiable", false);
      }
    }
  };
</script>
<style lang="less">
  .overview-modal {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    top: 0;
    margin: auto;
    z-index: 999;
    .mask {
      position: absolute;
      width: 100%;
      height: 100%;
      transform: scale(1.6);
      z-index: -1;
      background-color: rgba(0, 0, 0, 0.2);
    }
    .modal-content {
      margin: 100px auto;
      width: 270px;
      background-color: #fff;
      border-radius: 15px;
    }
    h3 {
      font-size: 14px;
      height: 50px;
      line-height: 50px;
      text-align: center;
      border-bottom: 1px solid #e9ebf3;
    }
    .content {
      padding: 0 20px;
      .head,
      .info-item {
        display: flex;
        font-size: 12px;
        border-bottom: 1px solid #e9ebf3;
        span {
          flex: 1.2;
        }
        span:nth-child(2) {
          flex: 1.6;
        }
        span:last-child {
          flex: 1;
          text-align: right;
        }
      }
      .head {
        height: 40px;
        line-height: 40px;
        color: #6d757c;
      }
      .info-item {
        height: 45px;
        line-height: 45px;
        &:last-child {
          border-bottom: none;
        }
      }
    }
  }

  .modal-transform-leave-active,
  .modal-transform-enter-active {
    // transition: all 0.4s;
    transition: opacity 0.4s;
    transition: transform 0.2s;
  }

  .modal-transform-enter {
    opacity: 0;
    transform: scale(1.4);
  }

  .modal-transform-leave-to {
    opacity: 0;
    transform: scale(0.6);
  }
</style>

<template>
  <transition name="modal-transform">
    <div v-show="visiable" class="n-modal">
      <div class="mask" @click="hide"></div>
      <div class="modal-content shadow">
        <i class="el-icon-close" @click="hide"></i>
        <h3>{{ title }}</h3>
        <div class="inner-content">
          <slot></slot>
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
    title: String,
    list: {
      type: Array,
      default: () => []
    }
  },
  watch: {
    visiable(val) {
      if (val === false) {
        this.$emit("close");
      }
    }
  },

  created() {},

  mounted() {},
  methods: {
    hide() {
      this.$emit("update:visiable", false);
      // this.$emit("close");
    }
  }
};
</script>
<style lang="less">
.n-modal {
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
    position: relative;
    margin: 100px auto;
    width: 270px;
    background-color: #fff;
    border-radius: 15px;
  }
  .el-icon-close {
    font-size: 16px;
    color: #909399;
    position: absolute;
    right: 15px;
    top: 15px;
    cursor: pointer;
    &:hover {
      color: #53b8a9;
    }
  }
  h3 {
    font-size: 14px;
    height: 50px;
    line-height: 50px;
    text-align: center;
    border-bottom: 1px solid #e9ebf3;
  }
  .inner-content {
    padding: 0 20px;
  }
}

.modal-transform-leave-active,
.modal-transform-enter-active {
  transition: all 0.3s;
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

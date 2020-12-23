<template>
  <div class="overview">
    <div class="top">
      <div class="left">
        <label>{{ accountName }}</label>
        <span>${{ balance }}</span>
      </div>
      <div class="right clicks">
        <img src="../../assets/img/application.svg" alt="" />
        <span>{{ $t("home.home1") }}</span>
      </div>
    </div>
    <div class="bottom">
      <ul>
        <li @click="toUrl('/inner-transfer')">
          <img src="../../assets/img/transfer.svg" alt="" />
          <p>{{ $t("home.home2") }}</p>
        </li>
        <li @click="toUrl('/cross-txlist')">
          <img src="../../assets/img/tx-record.svg" alt="" />
          <p>{{ $t("home.home3") }}</p>
        </li>
        <li @click="$emit('show-modal')">
          <img src="../../assets/img/overview.svg" alt="" />
          <p>{{ $t("home.home4") }}</p>
        </li>
        <li @click="toUrl('/account-manage')">
          <img src="../../assets/img/account.svg" alt="" />
          <p>{{ $t("home.home5") }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {};
  },
  props: {
    accountName: String,
    balance: [String, Number]
  },

  components: {},

  watch: {},

  computed: {},

  mounted() {},

  methods: {
    toUrl(path) {
      this.$router.push(path);
    }
  }
};
</script>
<style lang="less">
.overview {
  padding: 10px 15px 25px;
  height: 117px;
  position: relative;
  z-index: 1;
  &:after {
    width: 160%;
    height: 100%;
    position: absolute;
    left: -30%;
    top: 0;
    z-index: -1;
    content: "";
    border-radius: 0 0 50% 50%;
    box-shadow: inset 0 -6px 10px -3px rgba(135, 134, 134, 0.16);
  }
  .top {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
    .left {
      flex: 1;
      label {
        max-width: 80px;
        padding-right: 5px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        display: inline-block;
        vertical-align: middle;
      }
      span {
        display: inline-block;
        vertical-align: middle;
        height: 20px;
        line-height: 21px;
        text-align: center;
        border-radius: 20px;
        background-color: #e5f8f5;
        color: #53b8a9;
        padding: 0 10px;
      }
    }
    .right {
      display: flex;
      align-items: center;
      img {
        width: 20px;
        margin-right: 6px;
      }
      span {
        line-height: 1;
        font-size: 14px;
      }
    }
  }
  .bottom {
    padding-top: 16px;
    ul {
      display: flex;
      li {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        img {
          height: 24px;
          margin-bottom: 3px;
        }
      }
    }
  }
}
</style>

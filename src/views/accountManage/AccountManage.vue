<template>
  <div class="account-manage" v-loading="loading">
    <common-head>
      {{ $t("accountManage.accountManage1") }}
    </common-head>
    <div class="content">
      <div class="account-name">
        <template v-if="!editName">
          <span class="overflow">{{ account.name }}</span>
          <img src="../../assets/img/edit.svg" @click="editName = true" />
        </template>
        <template v-else>
          <el-input v-model="newName"></el-input>
          <i class="el-icon-check" @click="updateAccountName"></i>
          <i class="el-icon-close" @click="editName = false"></i>
        </template>
      </div>
      <div class="content-item">
        <div>
          <img src="../../assets/img/keystore.svg" alt="" />
          <span>{{ $t("accountManage.accountManage2") }}</span>
        </div>
        <i class="el-icon-arrow-right"></i>
      </div>
      <div class="content-item" @click="showBackup = true">
        <div>
          <img src="../../assets/img/pri.svg" alt="" />
          <span>{{ $t("accountManage.accountManage3") }}</span>
        </div>
        <i class="el-icon-arrow-right"></i>
      </div>
      <div class="content-item" @click="showChangePass = true">
        <div>
          <img src="../../assets/img/password.svg" alt="" />
          <span>{{ $t("accountManage.accountManage4") }}</span>
        </div>
        <i class="el-icon-arrow-right"></i>
      </div>
      <div
        v-if="accountList.length > 1"
        class="content-item"
        @click="showRemoveAccount = true"
      >
        <div class="remove-account">
          <img src="../../assets/img/del.svg" alt="" />
          <span>{{ $t("accountManage.accountManage5") }}</span>
        </div>
        <i class="el-icon-arrow-right"></i>
      </div>
    </div>
    <Modal
      :visiable.sync="showBackup"
      :title="$t('accountManage.accountManage3')"
      class="backup-address"
      @close="modalClose"
    >
      <template v-if="!confirm">
        <p class="tip">{{ $t("accountManage.accountManage7") }}</p>
        <el-input v-model="password" type="password"></el-input>
        <div class="btn-wrap">
          <el-button @click="showBackup = false">
            {{ $t("public.cancel") }}
          </el-button>
          <el-button type="primary" @click="backupPri">
            {{ $t("public.confirm") }}
          </el-button>
        </div>
      </template>
      <template v-else>
        <p class="pri">{{ pri }}</p>
        <el-button type="primary" @click="copy">
          {{ $t("public.copy") }}
        </el-button>
      </template>
    </Modal>
    <Modal
      :visiable.sync="showChangePass"
      :title="$t('accountManage.accountManage4')"
      class="change-password"
      @close="modalClose"
    >
      <el-form
        :model="changePsForm"
        status-icon
        :rules="changePsRuls"
        ref="changePsForm"
        label-position="top"
      >
        <el-form-item :label="$t('public.oldPassword')" prop="old">
          <el-input type="password" v-model="changePsForm.old"></el-input>
        </el-form-item>
        <el-form-item :label="$t('public.password')" prop="pass">
          <el-input type="password" v-model="changePsForm.pass"></el-input>
        </el-form-item>
        <el-form-item :label="$t('public.checkPassword')" prop="checkPass">
          <el-input type="password" v-model="changePsForm.checkPass"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm('changePsForm')">
            {{ $t("public.confirm") }}
          </el-button>
        </el-form-item>
      </el-form>
    </Modal>
    <Modal
      :visiable.sync="showRemoveAccount"
      :title="$t('accountManage.accountManage5')"
      class="remove-address"
      @close="modalClose"
    >
      <template v-if="!confirm">
        <p class="tip">
          <i class="el-icon-warning"></i>
          <span>{{ $t("accountManage.accountManage9") }}</span>
        </p>
        <div class="btn-wrap">
          <el-button @click="showRemoveAccount = false">
            {{ $t("public.cancel") }}
          </el-button>
          <el-button type="primary" @click="confirm = true">
            {{ $t("public.confirm") }}
          </el-button>
        </div>
      </template>
      <template v-else>
        <p class="tip">{{ $t("accountManage.accountManage7") }}</p>
        <el-input v-model="password" type="password"></el-input>
        <div class="btn-wrap">
          <el-button @click="showRemoveAccount = false">
            {{ $t("public.cancel") }}
          </el-button>
          <el-button type="primary" @click="removeAccount">
            {{ $t("public.confirm") }}
          </el-button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script>
import CommonHead from "@/components/CommonHead";
import Modal from "@/components/Modal";
import { copys, checkPassword, getPri, encryptPassword } from "@/utils/util";
import { getAesPri_PubByPri } from "@/utils/api";
import ExtensionPlatform from "@/utils/extension";
export default {
  data() {
    const validateOld = async (rule, value, callback) => {
      const correct = await checkPassword(value);
      if (value === "") {
        callback(new Error(this.$t("login.login1")));
      } else if (!correct) {
        callback(new Error(this.$t("login.login11")));
      } else {
        callback();
      }
    };
    const validatePass = (rule, value, callback) => {
      const reg = /(?!^\d+$)(?!^[a-zA-Z]+$)^[0-9a-zA-Z]{8,20}$/;
      if (value === "") {
        callback(new Error(this.$t("login.login1")));
      } else if (!reg.exec(value)) {
        callback(new Error(this.$t("login.login2")));
      } else {
        callback();
      }
    };
    const validatePass2 = (rule, value, callback) => {
      if (value === "") {
        callback(new Error(this.$t("login.login3")));
      } else if (value !== this.changePsForm.pass) {
        callback(new Error(this.$t("login.login4")));
      } else {
        callback();
      }
    };
    return {
      loading: false,
      pri: "",
      changePsForm: {
        old: "",
        pass: "",
        checkPass: ""
      },
      changePsRuls: {
        old: [{ validator: validateOld, trigger: ["blur"] }],
        pass: [{ validator: validatePass, trigger: ["blur"] }],
        checkPass: [{ validator: validatePass2, trigger: ["blur"] }]
      },
      editName: false,
      newName: this.$store.getters.currentAccount.name,
      showBackup: false, // 备份弹窗
      password: "", //备份私钥密码
      confirm: false, //备份密码确认
      showChangePass: false, //修改密码弹窗
      showRemoveAccount: false, //移除账户弹窗
    };
  },
  components: {
    CommonHead,
    Modal
  },

  watch: {},

  computed: {
    account() {
      return this.$store.getters.currentAccount || {};
    },
    accountList() {
      return this.$store.state.accountList;
    }
  },

  created() {},

  mounted() {},

  methods: {
    updateAccountName() {
      if (this.newName !== this.account.name) {
        const accountList = [...this.accountList];
        accountList.map(item => {
          if (item.selection) {
            item.name = this.newName;
          }
        });
        this.$store.dispatch("setAccount", accountList);
      }
      this.editName = false;
    },
    async backupPri() {
      const correct = await checkPassword(this.password);
      if (correct) {
        this.pri = getPri(this.account.aesPri, this.password);
        this.confirm = true;
      } else {
        this.$message({
          message: this.$t("accountManage.accountManage8"),
          type: "error",
          duration: 2000
        });
      }
    },
    copy() {
      copys(this.pri);
      this.$message({
        message: this.$t("public.copySuccess"),
        type: "success",
        duration: 1000
      });
      this.showBackup = false;
    },
    submitForm(formName) {
      this.$refs[formName].validate(async valid => {
        if (valid) {
          this.loading = true;
          const accountList = [...this.accountList];
          accountList.map(item => {
            const pri = getPri(item.aesPri, this.changePsForm.old);
            const { aesPri, pub } = getAesPri_PubByPri(
              this.changePsForm.pass,
              pri
            );
            item.aesPri = aesPri;
            item.pub = pub;
          });
          await this.$store.dispatch("setAccount", accountList);
          const encryptedPassword = encryptPassword(this.changePsForm.pass);
          ExtensionPlatform.set({ password: encryptedPassword });
          this.$message({
            message: this.$t("accountManage.accountManage6"),
            type: "success",
            duration: 1000
          });
          this.loading = false;
          this.showChangePass = false;
        } else {
          return false;
        }
      });
    },
    async removeAccount() {
      this.loading = true;
      const accountList = [...this.accountList];
      const newAccount = accountList.filter(item => !item.selection);
      if (newAccount.length) {
        newAccount[0].selection = true;
      }
      await this.$store.dispatch("setAccount", newAccount);
      this.$message({
        message: this.$t("accountManage.accountManage10"),
        type: "success",
        duration: 1000
      });
      this.loading = false;
      const path = newAccount.length ? "/" : "/new-address";
      this.$router.push(path);
    },
    modalClose() {
      this.password = "";
      this.changePsForm.old = "";
      this.changePsForm.pass = "";
      this.changePsForm.checkPass = "";
      this.$refs.changePsForm.resetFields();
      setTimeout(() => {
        this.confirm = false;
      }, 500);
    }
  }
};
</script>
<style lang="less">
.account-manage {
  height: 100%;
  background: #f9fafc;
  .account-name,
  .content-item {
    height: 54px;
    margin-bottom: 3px;
    padding: 0 25px;
    background-color: #fff;
    display: flex;
    align-items: center;
    img {
      height: 16px;
    }
    .el-icon-arrow-right {
      color: #ced7df;
      font-size: 18px;
      font-weight: 600;
    }
    &:hover {
      // background-color: #f2f3f4;
    }
  }
  .content-item {
    cursor: pointer;
  }
  .account-name {
    span {
      display: inline-block;
      max-width: 50%;
    }
    img {
      cursor: pointer;
      margin-left: 15px;
    }
    .el-input {
      width: 60%;
    }
    i {
      cursor: pointer;
      font-size: 22px;
      font-weight: 600;
      color: #ced7df;
      &:hover {
        transform: scale(1.1);
      }
      &.el-icon-check {
        color: #53b8a9;
      }
    }
  }
  .content-item {
    justify-content: space-between;
    div {
      display: flex;
      align-items: center;
    }
    img {
      margin-right: 8px;
    }
    .remove-account {
      span {
        color: #fd775a;
      }
    }
  }
  .backup-address,.change-password,.remove-address {
    .inner-content {
      padding: 10px 20px;
    }
    .tip {
      font-size: 12px;
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      .el-icon-warning {
        color: rgb(230, 162, 60);
        font-size: 20px;
        margin-right: 5px;
      }
    }
    .pri {
      width: 100%;
      word-break: break-all;
    }
    .el-button {
      width: 100%;
      margin-top: 10px;
    }
    .btn-wrap {
      text-align: center;
      margin-bottom: 5px;
      .el-button {
        width: 47%;
        height: 35px;
        border-radius: 0;
        font-size: 12px;
      }
    }
  }
}
</style>

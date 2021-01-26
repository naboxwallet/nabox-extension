<template>
  <div class="change-password">
    <common-head>
      {{ $t("accountManage.accountManage4") }}
    </common-head>
    <el-form status-icon :model="changePsForm" :rules="changePsRuls" ref="changePsForm" label-position="top">
      <el-form-item :label="$t('public.oldPassword')" prop="old">
        <el-input type="password" v-model="changePsForm.old">
        </el-input>
      </el-form-item>
      <el-form-item :label="$t('public.password')" prop="pass">
        <el-input type="password" v-model="changePsForm.pass">
        </el-input>
      </el-form-item>
      <el-form-item :label="$t('public.checkPassword')" prop="checkPass">
        <el-input type="password" v-model="changePsForm.checkPass">
        </el-input>
      </el-form-item>
      <el-form-item class="tc">
        <el-button type="primary" @click="submitForm('changePsForm')">
          {{ $t("public.confirm") }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
  import CommonHead from "@/components/CommonHead";
  import ExtensionPlatform from "@/utils/extension";
  import {checkPassword, getPri, encryptPassword} from "@/utils/util";
  import {getAesPri_PubByPri} from "@/utils/api";

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
        changePsForm: {
          old: "",
          pass: "",
          checkPass: ""
        },
        changePsRuls: {
          old: [{validator: validateOld, trigger: ["blur"]}],
          pass: [{validator: validatePass, trigger: ["blur"]}],
          checkPass: [{validator: validatePass2, trigger: ["blur"]}]
        },
      };
    },
    components: {
      CommonHead
    },
    computed: {
      accountList() {
        return this.$store.state.accountList;
      }
    },
    mounted() {
      this.$goHome = true;
    },
    destroyed() {
      this.$goHome = false;
    },
    methods: {

      submitForm(formName) {
        this.$refs[formName].validate(async valid => {
          if (valid) {
            this.loading = true;
            const accountList = [...this.accountList];
            accountList.map(item => {
              const pri = getPri(item.aesPri, this.changePsForm.old);
              const {aesPri, pub} = getAesPri_PubByPri(
                this.changePsForm.pass,
                pri
              );
              item.aesPri = aesPri;
              item.pub = pub;
            });
            await this.$store.dispatch("setAccount", accountList);
            const encryptedPassword = encryptPassword(this.changePsForm.pass);
            ExtensionPlatform.set({password: encryptedPassword});
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

      modalClose() {
        this.changePsForm.old = "";
        this.changePsForm.pass = "";
        this.changePsForm.checkPass = "";
        this.$refs.changePsForm.resetFields();
      }

    }
  };
</script>

<style lang="less">
  @import "../../assets/css/style.less";

  .change-password {
    .el-form--label-top {
      width: 80%;
      margin: 20% auto 0;
      .el-button {
        width: 90%;
        margin-top: 10px;
        height: 35px;
        border-radius: 20px;
        font-size: 12px;
      }
    }
  }
</style>

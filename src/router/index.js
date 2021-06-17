import Vue from "vue";
import VueRouter from "vue-router";
// import Home from "../views/home/Home.vue";

Vue.use(VueRouter);

// 解决跳转当前路由报错问题
const originalPush = VueRouter.prototype.push;
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => err);
};

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("../views/home/Home.vue")
  },
  {
    path: "/inner-transfer",
    name: "InnerTransfer",
    component: () => import("../views/Transfer/InnerTransfer.vue")
  },
  {
    path: "/in-chain-transfer",
    name: "InChainTransfer",
    component: () => import("../views/Transfer/InChainTransfer.vue")
  },
  {
    path: "/cross-chain-transfer",
    name: "CrossChainTransfer",
    component: () => import("../views/Transfer/CrossChainTransfer.vue")
  },
  {
    path: "/cross-txlist",
    name: "CrossTxList",
    component: () => import("../views/crossTxList/CrossTxList.vue")
  },
  {
    path: "/transfer-info",
    name: "TransferInfo",
    component: () => import("../views/transferInfo/TransferInfo.vue")
  },
  {
    path: "/account-manage",
    name: "AccountManage",
    component: () => import("../views/accountManage/AccountManage.vue")
  },
  {
    path: "/add-asset",
    name: "AddAsset",
    component: () => import("../views/addAsset/AddAsset.vue")
  },
  {
    path: "/asset-info",
    name: "AssetInfo",
    component: () => import("../views/assetInfo/AssetInfo.vue")
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/users/Login.vue")
  },
  {
    path: "/lock",
    name: "Lock",
    component: () => import("../views/users/Lock.vue")
  },
  {
    path: "/backup",
    name: "Backup",
    component: () => import("../views/users/Backup.vue")
  },
  {
    path: "/new-address",
    name: "NewAddress",
    component: () => import("../views/users/NewAddress.vue")
  },
  {
    path: "/change-password",
    name: "ChangePassword",
    component: () => import("../views/users/ChangePassword.vue")
  },
  {
    path: "/authorization",
    name: "Authorization",
    component: () => import("../views/users/Authorization.vue")
  },
  {
    path: "/notification/authorization",
    name: "NotificationAuthorization",
    component: () => import("../views/notification/Authorization.vue")
  },
  {
    path: "/notification/send-transaction",
    name: "NotificationSendTransaction",
    component: () => import("../views/notification/SendTransaction.vue")
  },
  {
    path: "/notification/sign-hex",
    name: "NotificationSendHex",
    component: () => import("../views/notification/SignHex.vue")
  },
  {
    path: "/notification/sign-transaction",
    name: "NotificationSignTransaction",
    component: () => import("../views/notification/SignTransaction.vue")
  },
  {
    path: "/notification/send-cross-transaction",
    name: "NotificationSendCrossTransaction",
    component: () => import("../views/notification/SendCrossTransaction.vue")
  },
  {
    path: "/notification/send-eth-transaction",
    name: "NotificationSendEthTransaction",
    component: () => import("../views/notification/SendEthTransaction.vue")
  },
  {
    path: "/notification/transaction-serialize",
    name: "NotificationTransactionSerialize",
    component: () => import("../views/notification/TransactionSerialize.vue")
  },
  {
    path: "/notification/contract-call",
    name: "NotificationContractCall",
    component: () => import("../views/notification/ContractCall.vue")
  },
  {
    path: "/notification/sign-message",
    name: "NotificationSignMessage",
    component: () => import("../views/notification/SignMessage.vue")
  },
  {
    path: "/about",
    name: "About",
    component: () => import("../views/About.vue")
  }
];

const router = new VueRouter({
  routes
});

export default router;

import zhLocale from 'element-ui/lib/locale/lang/zh-CN'

const cn = {
  /* home: {
    extName: "NULS 钱包"
  }, */
  header: {
    header1: "主网",
    header2: "测试网",
    header3: "Switch To English",
    header4: "切换账户",
    header5: "创建账户",
    header6: "导入账户",
    header7: "当前版本："
  },
  public: {
    confirm: "确认",
    cancel: "取消",
    symbol: "币种",
    amount: "数量",
    total: "总量",
    available: "可用",
    lock: "锁定",
    unlock: "解锁",
    all: "全部",
    next: "下一步",
    fee: "手续费",
    remark: "备注",
    createTime: "时间",
    status: "状态",
    percent: "占比",
    copySuccess: "复制成功",
    create: "创建账户",
    import: "导入账户",
    password: "密码",
    checkPassword: "确认密码",
    oldPassword: "原密码",
    newAddress: "新建账户",
    copy: "复制",
    network: "网络",
    createError: "创建账户异常，请稍后重试"
  },
  login: {
    login1: "请输入密码",
    login2: "请输入由字母和数字组合的8-20位密码",
    login3: "请再次输入密码",
    login4: "两次输入密码不一致",
    login5: "已有账户, ",
    login6: "点击导入",
    login7: "新建账户",
    login8: "请输入私钥",
    login9: "私钥格式错误",
    login10: "账户名称",
    login11: "密码错误"
  },
  home: {
    home1: "应用",
    home2: "内部转账",
    home3: "跨链交易",
    home4: "资产总览",
    home5: "账户设置",
    home6: "总资产",
    home7: "本链转账",
    home8: "跨链转账",
    home9: "资产",
    home10: "交易记录",
    home11: "隐藏小额资产",
    home12: "资产总览"
  },
  innerTransfer: {
    innerTransfer1: "内部转账",
    innerTransfer2: "Nabox的划转功能是通过跨链交易实现，因此需消耗交易手续费，划转到账的时间取决于进行跨链交易的两条链上的交易确认时间。",
    innerTransfer3: "从",
    innerTransfer4: "到"
  },
  transfer: {
    transfer1: "请输入正确的本链地址",
    transfer2: "请输入交易数量",
    transfer3: "金额必须为数字并且小数点后最多位数为",
    transfer4: "最大转出金额为",
    transfer5: "请输入gas",
    transfer6: "Gag Limit范围;1~10000000",
    transfer7: "请输入price",
    transfer8: "Price必须大于1",
    transfer9: "高级选项",
    transfer10: "验证调用合约交易异常",
    transfer11: "高级选项",
    transfer12: "预估调用合约交易的gas异常",
    transfer13: "交易已发出，等待区块确认",
    transfer14: "加速",
    transfer15: "请输入正确的转出地址",
    transfer16: "请选择跨链网络",
    transfer17: "慢",
    transfer18: "中",
    transfer19: "快",
    transfer20: "自定义",
  },
  transferConfirm: {
    transferConfirm1: "转账确认",
    transferConfirm2: "发送者",
    transferConfirm3: "接收者",
  },
  crossTxList: {
    crossTxList1: "交易记录",
    crossTxList2: "网络",
    crossTxList3: "币种",
    crossTxList4: "查询"
  },
  transferInfo: {
    transferInfo1: "交易详情"
  },
  accountManage: {
    accountManage1: "账户设置",
    accountManage2: "Keystore备份",
    accountManage3: "私钥备份",
    accountManage4: "修改密码",
    accountManage5: "移除账户",
    accountManage6: "修改密码成功",
    accountManage7: "请输入密码",
    accountManage8: "密码错误",
    accountManage9: "移除成功后，账户信息将被彻底删除，请确认已备份好账户私钥",
    accountManage10: "移除账户成功",
  },
  addAsset: {
    addAsset1: "管理资产",
    addAsset2: "请输入Token名称或合约地址",
  },
  assetInfo: {
    // assetInfo1:: "" 
  },
  authorization: {
    authorization1: "请勾选需要连接的账户",
    authorization2: "该网站将获得以下权限",
    authorization3: "读取账户信息",
    authorization4: "连接",
  },
  statusType: {
    1: "已确认",
    0: "未确认"
  },
  ...zhLocale
};
export default cn;

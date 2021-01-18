const EventEmitter = require("eventemitter3");

const resolvers = [];

const addListenerFromContent = () => {
  window.addEventListener("message", event => {
    if (event.origin === location.origin) {
      for (let i = 0; i < resolvers.length; i++) {
        if (resolvers[i].type === event.data.type) {
          if (!event.data.status) {
            resolvers[i].reject(event.data.payload);
            //"User rejected the request"
          } else {
            resolvers[i].resolve(event.data.payload);
          }
          resolvers.splice(i, 1);
        }
      }
    }
  });
};

const send = (method, data = {}) => {
  return new Promise((resolve, reject) => {
    resolvers.push({
      type: method,
      resolve,
      reject
    });
    window.postMessage({ method, data }, location.origin);
  });
};

const injectExtensionState = () => {
  return send("injectState");
};

class Nabox extends EventEmitter {
  constructor() {
    super();
    addListenerFromContent();
    this.chainId = "";
    this.accounts = null;
    this.connected = false;
    injectExtensionState().then(res => {
      this.chainId = res.chainId;
      this.accounts = res.accounts;
      this.connected = res.accounts.length ? true : false;
    });
  }

  /**
   * 授权连接插件
   * @return {object}  返回当前选中账户{beta: xx,main:xx}
   */
  createSession() {
    return send("createSession").then(accounts => {
      // console.log(accounts, "==accounts==");
      this.accounts = accounts;
      return accounts;
    });
  }
  /**
   * @desc 发送转账交易
   * @param {object} tx
   * @param {string} tx.from
   * @param {string} tx.to
   * @param {?string} tx.data
   * @param {string} tx.value
   * @param {?string} tx.assetChainId 转账资产链ID
   * @param {?string} tx.assetId 转账资产ID
   * @param {?string} tx.contractAddress 转账资产智能合约地址
   */
  sendTransaction(tx) {
    return send("sendTransaction", tx).then(res => {
      return res;
    });
  }

  /**
   * @desc 发送跨链转账交易
   * @param {object} tx
   * @param {string} tx.from
   * @param {string} tx.to
   * @param {?string} tx.data
   * @param {string} tx.value
   * @param {?string} tx.assetChainId 转账资产链ID
   * @param {?string} tx.assetId 转账资产ID
   * @param {?string} tx.contractAddress 转账资产智能合约地址
   * @param {"NULS"|"NERVE"|"BSC"|"Ethereum" | "Heco"} tx.toChain 转账资产智能合约地址
   */
  sendCrossTransaction(tx) {
    return send("sendCrossTransaction", tx).then(res => {
      return res;
    });
  }

  /**
   * @desc 交易签名
   * @param {object} tx
   * @param {string} tx.from
   * @param {string} tx.to
   * @param {?string} tx.data
   * @param {string} tx.value
   * @param {?string} tx.assetChainId 转账资产链ID
   * @param {?string} tx.assetId 转账资产ID
   * @param {?string} tx.contractAddress 转账资产智能合约地址
   */
  signTransaction(tx) {
    return send("signTransaction", { sign: true, ...tx }).then(res => {
      return res;
    });
  }

  /**
   * @desc 跨链转账交易签名
   * @param {object} tx
   * @param {string} tx.from
   * @param {string} tx.to
   * @param {?string} tx.data
   * @param {string} tx.value
   * @param {?string} tx.assetChainId 转账资产链ID
   * @param {?string} tx.assetId 转账资产ID
   * @param {?string} tx.contractAddress 转账资产智能合约地址
   * @param {"NULS"|"NERVE"|"BSC"|"Ethereum" | "Heco"} tx.toChain 转账资产智能合约地址
   */
  signCrossTransaction(tx) {
    return send("signTransaction", { sign: true, ...tx }).then(res => {
      return res;
    });
  }

  /**
   * @desc 获取资产
   * @param {object} data
   * @param {string} data.chain
   * @param {string} data.network
   * @param {string|number} data.chainId
   * @param {string|number} data.assetId
   * @return {object}
   */
  getBalance(data) {}
}

class Inject {
  constructor() {
    window.nabox = new Nabox();
    //监听授权网址、网络、选中账户变化
    window.addEventListener("message", event => {
      if (event.origin === location.origin) {
        const { type, payload } = event.data;
        if (!type) return;
        // 支持绑定的事件
        const types = [
          "changeAllowSites",
          "accountsChanged",
          "networkChanged",
          "connect",
          "session_update",
          "disconnect"
        ];
        if (types.indexOf(type) > -1) this.emitEvent(type, payload);
      }
    });

    /* window.nabox.on("connect", (error, res)=>{console.log(error, res, "----connect----")})
    window.nabox.on("session_update", (error, res)=>{console.log(error, res, "----session_update----")})
    window.nabox.on("disconnect", (error, res)=>{console.log(error, res, "----disconnect----")}) */
  }
  emitEvent(type, data) {
    // console.log(type, 6666)
    // let property;
    switch (type) {
      case "connect":
      case "session_update":
        window.nabox.accounts = data.accounts;
        window.nabox.chainId = data.chainId;
        break;
      case "disconnect":
        window.nabox.connected = false;
        window.nabox.accounts = null;
      /* case "changeAllowSites":
      case "accountsChanged":
        property = "selectedAccount";
        break;
      case "networkChanged":
        property = "network";
        break;
      case "disconnect":
        window.nabox.connected = false;
        window.nabox.selectedAccount = null;
        window.nabox.emit("disconnect", false);
        return; */
    }
    /* console.log(444);
    window.nabox[property] = data;
    window.nabox.emit(type, data); */
    window.nabox.emit(type, "", { params: [data] });
  }
}
new Inject();

const EventEmitter = require("eventemitter3");

const resolvers = [];

const addListenerFromContent = () => {
  window.addEventListener("message", event => {
    if (event.origin === location.origin) {
      for (let i = 0; i < resolvers.length; i++) {
        if (resolvers[i].type === event.data.type) {
          if (!event.data.status) {
            resolvers[i].reject("User rejected the request");
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

class NaboxBridge extends EventEmitter {
  constructor() {
    super();
    addListenerFromContent();
    this.chainId = "";
    this.accounts = null;
    this.connected = false;
    injectExtensionState().then(res => {
      this.chainId = res.chainId;
      this.accounts = res.accounts;
      this.connected = res.accounts ? true : false;
    });
  }

  /**
   * 授权连接插件
   * @return {object}  返回当前选中账户{beta: xx,main:xx}
   */
  createSession() {
    return send("createSession").then(accounts => {
      console.log(accounts, "==accounts==");
      this.accounts = accounts;
      return accounts;
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
    window.naboxBridge = new NaboxBridge();
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
    /* window.naboxBridge.on("accountsChanged", (res)=>{console.log(res, "----account----")})
    window.naboxBridge.on("networkChanged", (res)=>{console.log(res, "----network----")}) */

    window.naboxBridge.on("connect", (error, res)=>{console.log(error, res, "----connect----")})
    window.naboxBridge.on("session_update", (error, res)=>{console.log(error, res, "----session_update----")})
    window.naboxBridge.on("disconnect", (error, res)=>{console.log(error, res, "----disconnect----")})
  }
  emitEvent(type, data) {
    console.log(type, 6666)
    // let property;
    switch (type) {
      case "connect":
      case "session_update":
        window.naboxBridge.accounts = data.accounts;
        window.naboxBridge.chainId = data.chainId;
        break;
      case "disconnect":
        window.naboxBridge.connected = false;
        window.naboxBridge.accounts = null;
      /* case "changeAllowSites":
      case "accountsChanged":
        property = "selectedAccount";
        break;
      case "networkChanged":
        property = "network";
        break;
      case "disconnect":
        window.naboxBridge.connected = false;
        window.naboxBridge.selectedAccount = null;
        window.naboxBridge.emit("disconnect", false);
        return; */
    }
    /* console.log(444);
    window.naboxBridge[property] = data;
    window.naboxBridge.emit(type, data); */
    window.naboxBridge.emit(type, "", { params: [data] });
  }
}
new Inject();

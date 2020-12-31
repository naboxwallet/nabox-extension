console.log("我是inPage, web页面与插件通信的桥梁...................");
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
    this.network = "";
    this.selectedAccount = null;
    injectExtensionState().then(res => {
      this.network = res.network;
      this.selectedAccount = res.selectedAccount;
    });
  }

  /**
   * 授权连接插件
   * @return {object} {beta: xx,main:xx}
   */
  connect() {
    return send("connect").then(selectedAccount => {
      console.log(selectedAccount, "==selectedAccount==");
      this.selectedAccount = selectedAccount;
      return selectedAccount;
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
    window.addEventListener("message", event => {
      if (event.origin === location.origin) {
        const { type, payload } = event.data;
        if (!type) return;
        if (type === "changeAllowSites") {
          window.naboxBridge.selectedAccount = payload;
          window.naboxBridge.emit("accountsChanged", payload);
        } else if (type === "accountsChanged") {
          window.naboxBridge.selectedAccount = payload;
          window.naboxBridge.emit("accountsChanged", payload);
        } else if (type === "networkChanged") {
          window.naboxBridge.network = payload;
          window.naboxBridge.emit("networkChanged", payload);
        } else {
          // console.log(1)
        }
      }
    });
  }
}
new Inject();

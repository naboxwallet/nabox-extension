console.log("我是inPage, web页面与插件通信的桥梁");
const EventEmitter = require("eventemitter3");
window.aa = 123;
class NaboxBridge extends EventEmitter {
  constructor() {
    super();
    this.injectExtensionState();
  }
  network = "";
  currentAccount = "";
  injectStateHandle = () => {};
  connectHandle = () => {};
  getBalanceHandle = () => {};

  injectExtensionState() {
    this.sendData("injectState", {}, response => {
      this.removeMsgListener(this.injectStateHandle);
      console.log(response, 89)
      if (response.type === "injectState") {
        this.network = response.network;
        this.currentAccount = response.currentAccount;
      }
    });
    /* const handle = event => {
      if (event.origin === location.origin) {
        console.log(event.data, "====inPage====");
        if (event.data.type === "injectState") {
          this.network = event.data.network;
          this.currentAccount = event.data.currentAccount;
          this.removeMsgListener(this.handle);
        }
      }
    };
    this.addMsgListener(handle); */
  }

  connected() {
    return true;
  }
  connect() {
    return new Promise((resolve, reject) => {
      this.sendData("connect", {}, response => {
        this.removeMsgListener(this.connectHandle);
        if (response.type === "connect") {
          console.log(response, "===connect");
          resolve(response.address);
        } else {
          console.log(response, "===connect---reject");
          reject(response);
        }
      });
    });
  }

  getBalance(data) {
    return new Promise((resolve, reject) => {
      this.sendData("getBalance", { ...data }, response => {
        this.removeMsgListener(this.getBalanceHandle);
        if (response.type === "getBalance") {
          console.log(response, "===getBalance");
          resolve(response.address);
        } else {
          console.log(response, "===getBalance---reject");
          reject(response);
        }
      });
    });
  }

  sendData(method, data, callback) {
    window.postMessage({ method, data }, location.origin);
    const handleName = method + "Handle";
    console.log(handleName, "8899")
    this[handleName] = function(event) {
      if (event.origin === location.origin) {
        // console.log(event, "====inPage====");
        callback(event.data);
      }
    };
    this.addMsgListener(this[handleName]);
  }

  addMsgListener(fn) {
    window.addEventListener("message", fn);
  }

  removeMsgListener(fn) {
    window.removeEventListener("message", fn);
  }
}
window.naboxBridge = new NaboxBridge();
// console.log(window.naboxBridge, 999888777)
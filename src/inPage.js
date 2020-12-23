console.log("我是inPage, web页面与插件通信的桥梁");

/* function NaboxBridge() {
  this.connect = function() {
    console.log("调用连接方法");
  };
}
NaboxBridge() */

class NaboxBridge {
  constructor() {
    this.addListener();
  }
  chain = "";
  selectedAddress = "";
  connectHandle = () => {};
  getBalanceHandle = () => {};

  connected() {
    return true;
  }
  connect() {
    return new Promise((resolve, reject) => {
      this.sendData("connect", {}, response => {
        this.removeListener(this.connectHandle);
        // console.log(this.connectHandle, 999988887777)
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
        this.removeListener(this.getBalanceHandle);
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
    this[handleName] = function(event) {
      if (event.origin === location.origin) {
        // console.log(event, "====inPage====");
        if (event.data.status) {
          callback(event.data);
        }
      }
    };
    console.log(handleName, "=====handleName=====")
    this.addListener(this[handleName]);
  }

  addListener(fn) {
    window.addEventListener("message", fn);
  }

  removeListener(fn) {
    window.removeEventListener("message", fn);
  }
}

const naboxBridge = new NaboxBridge();

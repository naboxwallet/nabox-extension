import "./mixEthereum/nabox-chrome"
import "./mixEthereum/nabox-metamask-core"
const EventEmitter = require("eventemitter3");

const resolvers = [];

const addListenerFromContent = () => {
  const handleResponse = (index, status, payload) => {
    if (!status) {
      resolvers[index].reject(payload);
    } else {
      resolvers[index].resolve(payload);
    }
    resolvers.splice(index, 1);
  }
  window.addEventListener("message", event => {
    if (event.origin === location.origin) {
      if (!event.data) return;
      if (!event.data.type) return;
      // console.log(event.data, "check-id")
      for (let i = 0; i < resolvers.length; i++) {
        if (!event.data.payload.id) {
          if (resolvers[i].type === event.data.type) {
            handleResponse(i, event.data.status, event.data.payload)
          }
        } else {
          if (resolvers[i].id === event.data.payload.id) {
            handleResponse(i, event.data.status, event.data.payload)
          }
        }
      }
    }
  });
};

const injectExtensionState = () => {
  return send("injectState");
};

const send = (method, data = {}, id) => {
  return new Promise((resolve, reject) => {
    resolvers.push({type: method, resolve, reject, id});
    window.postMessage({method, data}, location.origin);
  });
};

class Nabox extends EventEmitter {

  constructor() {
    super();
    addListenerFromContent();
    this.chainId = "";
    this.selectedAddress = null;
    this.connected = false;
    injectExtensionState().then(res => {
      this.chainId = res.chainId;
      this.selectedAddress = res.address;
      if (window.ethereum && window.ethereum.isNabox) {
        window.ethereum.chainId = res.chainId;
        window.ethereum.selectedAddress = res.address;
        window.ethereum.networkVersion = parseInt(res.chainId).toString();
      }
      this.connected = res.address ? true : false;
    });
  }

  /**
   * 授权连接插件
   * @return {array} 授权地址的第一个
   */
  createSession() {
    return send("createSession").then(accounts => {
      // this.accounts = accounts;
      // return accounts;
      this.chainId = accounts.chainId;
      this.selectedAddress = accounts.address;
      if (window.ethereum && window.ethereum.isNabox) {
        window.ethereum.chainId = accounts.chainId;
        window.ethereum.selectedAddress = accounts.address;
        window.ethereum.networkVersion = parseInt(accounts.chainId).toString();
      }
      // window.ethereum.selectedAddress = accounts.address;
      return [accounts.address];
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
    return send("sendTransaction", {sign: true, ...tx}).then(res => {
      return res;
    });
  }

  /**
   * @desc nuls 调用合约
   * @param {object} data
   * @param {string} data.from // 调用地址
   * @param {?number} data.value // 转入合约的NULS数量
   * @param {string} data.contractAddress // 合约地址
   * @param {string} data.methodName // 合约方法
   * @param {?string} data.methodDesc // 方法描述
   * @param {?array} data.args // 合约参数
   */
  contractCall(data) {
    return send("contractCall", data).then(res => {
      return res;
    });
  }

  /**
   * @desc nuls 查看合约
   * @param {object} data
   * @param {string} data.contractAddress // 合约地址
   * @param {string} data.methodName // 合约方法
   * @param {string} data.methodDesc // 方法描述
   * @param {array} data.args // 合约参数
   */
   invokeView(data) {
    return send("invokeView", data).then(res => {
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
   * @desc ETH 模拟metamask发起交易
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
  sendEthTransaction(tx) {
    // console.log(tx, "sendEthTransaction");
    return send("sendEthTransaction", tx).then(res => {
      return res;
    });
  }

  /**
   * @desc Hex 签名
   * @param {object} tx
   * @param {string} tx.from
   * @param {string} tx.to
   * @param {?string} tx.data
   * @param {string} tx.value
   * @param {?string} tx.assetChainId 转账资产链ID
   * @param {?string} tx.assetId 转账资产ID
   * @param {?string} tx.contractAddress 转账资产智能合约地址
   */
  signHex(tx) {
    return send("signHex", {sign: true, ...tx}).then(res => {
      return res;
    });
  }

  /**
   * @desc NULS NERVE链上通过txData发起普通交易
   * @param {object} tx
   * @param {address} tx.address 发送地址
   * @param {array} tx.inputs 
   * @param {array} tx.outputs
   * @param {?string} tx.remarks
   * @param {string} tx.type
   * @param {object} tx.txData
   */
  transactionSerialize(tx) {
    // console.log(tx, 123);
    return send("transactionSerialize", {sign: true, ...tx}).then(res => {
      return res;
    });
  }

  //获取账户资产列表
  assetsList(data) {
    //console.log(data,"789");
    return send("assetsList", {sign: true, ...data}).then(res => {
      return res;
    });
  }

  //以太坊接口透传
  ethCall(data) {
    return send("ethCall", {sign: true, ...data}, data.id).then(res => {
      return res;
    });
  }

  getChainId() {
    return send("getChainId").then(res => {
      return res;
    });
  }

  //获取账户余额
  getBalance(data) {
    return send("getBalance", {sign: true, ...data}).then(res => {
      return res;
    });
  }

  /** 
   * @desc 获取地址公钥
   * @param {object} data
   * @param {string} data.address
   * 
  */
  getPub(data) {
    return send("getPub", data).then(res => {
      return res;
    });
  }

  //断开连接
  offLink(data) {
    return send("offLink", {sign: true, ...data}).then(res => {
      //console.log(res, 2333);
      return res;
    });
  }

  //根据url判断是否授权
  isAuthorizationByUrl(data) {
    return send("isAuthorizationByUrl", {sign: true, ...data}).then(res => {
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
    // console.log(tx)
    /* return send("signTransaction", {sign: true, ...tx}).then(res => {
       return res;
     });*/
  }

  //hash签名
  signHashTransaction(hash) {
    return send("signHashTransaction", {hash}).then(res => {
      return res;
    });
  }

  /**
   * @desc 签名message
   * @param {array} data
   * @param {string} data[0] = message
   * @param {string} data[1] = address
   */
  signMessage(data) {
    return send("signMessage", data).then(res => {
      return res;
    });
  }
}

class Inject {

  constructor() {
    window.nabox = new Nabox();
    //监听授权网址、网络、选中账户变化
    window.addEventListener("message", event => {
      //console.log(event, "addEventListener");
      if (event.origin === location.origin) {
        if (!event.data) return;
        if (!event.data.type) return;
        const {type, payload} = event.data;
        // 支持绑定的事件
        const types = [
          "accountsChanged",//账户改变
          "chainChanged", // 链改变
        ];
        if (types.indexOf(type) > -1) this.emitEvent(type, payload);
      }
    });

    //判断是否有 MetaMask
    if (typeof window.ethereum === 'undefined' && (typeof window.web3 === 'undefined')) {
      console.log("not find MetaMask, import nabox MetaMask");
      // const theScript = document.createElement('script');
      //   theScript.src = 'http://127.0.0.1:5500/nabox-metamask-core.js';
      //   document.head.appendChild(theScript);

      //   const theScript2 = document.createElement('script');
      //   theScript2.src = 'http://127.0.0.1:5500/app_js/nabox-chrome.js';
      //   document.head.appendChild(theScript2);
      /* const theScript = document.createElement('script');
      //theScript.src = 'http://127.0.0.1:8848/app_js/nabox-metamask-core.js';
      theScript.src = 'https://release.nabox.io/js_beta/nabox-metamask-core.js';
      document.head.appendChild(theScript);

      const theScript2 = document.createElement('script');
      theScript2.src = 'https://release.nabox.io/js/nabox-chrome.js';
      //theScript2.src = 'http://127.0.0.1:8848/app_js/nabox-chrome.js';
      document.head.appendChild(theScript2); */

    } else {
      console.log("find MetaMask");
    }
  }

  emitEvent(type, data) {
    //console.log(type, data, 6666);
    switch (type) {
      case "accountsChanged": //连接插件、账户切换
        window.nabox.selectedAddress = data.address;
        window.nabox.chainId = data.chainId;
        window.nabox.emit(type, data.address ? [data.address] : []);
        if (window.ethereum && window.ethereum.isNabox) {
          window.ethereum.selectedAddress = data.address;
          window.ethereum.chainId = data.chainId;
          window.ethereum.networkVersion = parseInt(data.chainId).toString();
          window.ethereum.emit(type, data.address ? [data.address] : []);
        }
        break;
      case "chainChanged":
        window.nabox.chainId = data;
        window.nabox.emit(type, data);
        if (window.ethereum && window.ethereum.isNabox) {
          window.ethereum.chainId = data;
          window.ethereum.networkVersion = parseInt(data.chainId).toString();
          window.ethereum.emit(type, data);
        }
        break;
      case "disconnect": //断开连接
        window.nabox.selectedAddress = "";
        window.nabox.chainId = "";
        if (window.ethereum && window.ethereum.isNabox) {
          window.ethereum.selectedAddress = "";
          window.ethereum.chainId = "";
        }
        break;
    }
  }
}

if (!window.nabox) {
  new Inject();
}



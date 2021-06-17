import ExtensionPlatform from "@/utils/extension";
import NotificationService from "@/utils/NotificationService";
import {getStorage, getSelectedAccount, arrDistinctByProp, getBalances} from "@/utils/util";
import {request} from "@/utils/request";

class Prompt {
  constructor(routePath = "", domain = "", data = {}, responder = null) {
    this.routePath = routePath;
    this.domain = domain;
    this.data = data;
    this.responder = responder;
  }
}

const typeToPath = {
  createSession: "/notification/authorization",
  sendTransaction: "/notification/send-transaction",
  signTransaction: "/notification/sign-transaction",
  signHex: "/notification/sign-hex",
  sendCrossTransaction: "/notification/send-cross-transaction",
  sendEthTransaction: "/notification/send-eth-transaction",
  signHashTransaction: "/notification/hash-transaction",
  transactionSerialize: "/notification/transaction-serialize",
  contractCall: "/notification/contract-call",
  signMessage: "/notification/sign-message"
};

class Background {
  constructor() {
    this.addListener();
    this.lockAccount();
  }

  addListener() {
    // 监听content发来的消息，处理后再返回给content
    chrome.runtime.onMessage.addListener(
      (request, sender, sendResponse) => {
        const {type, url, icon, data = {}} = request;
        //console.log(type, url, icon, data);
        if (type === 'SIGN_CONNECT') return;
        if (type === "createSession") {
          data.icon = icon;
          this.createSession(type, url, data, sendResponse);
        } else {
          (async () => {
            const isAuthorized = await this.isAuthorized(url);
            if (isAuthorized) {
              if (type === "sendTransaction") { //交易签名并发送
                this.sendTransaction(type, url, data, sendResponse);
              } else if (type === "contractCall") { //nuls 调用合约
                this.contractCall(type, url, data, sendResponse);
              } else if (type === "signTransaction") { //交易签名
                this.signTransaction(type, url, data, sendResponse);
              } else if (type === "signHex") { //hex签名
                this.signHex(type, url, data, sendResponse);
              } else if (type === "sendCrossTransaction" || type === "signCrossTransaction") {
                this.sendCrossTransaction(type, url, data, sendResponse);
              } else if (type === "sendEthTransaction") {
                this.sendEthTransaction(type, url, data, sendResponse);
              } else if (type === 'signHashTransaction') {
                this.signHashTransaction(type, url, data, sendResponse);
              } else if (type === 'transactionSerialize') {  //nuls 交易签名
                this.transactionSerialize(type, url, data, sendResponse);
              } else if (type === 'assetsList') { //获取账户资产列表
                this.assetsList(type, url, data, sendResponse);
              } else if (type === 'getBalance') { //获取账户余额
                this.getBalance(type, url, data, sendResponse);
              } else if (type === 'getPub') { //获取账户公钥
                this.getPub(type, url, data, sendResponse);
              } else if (type === 'offLink') { //断开连接
                data.url = url;
                this.offLink(data)
              } else if (type === 'isAuthorizationByUrl') {
                this.isAuthorizationByUrl(type, url, data, sendResponse);
              } else if (type === 'ethCall') { //以太坊接口透传
                this.ethCall(type, url, data, sendResponse);
              } else if (type === "signMessage") {
                this.signMessage(type, url, data, sendResponse);
              } else if (type === "invokeView") {
                this.invokeView(type, url, data, sendResponse);
              }
            } else {
              sendResponse({type, status: false, payload: "Please connect the plugin first"});
            }
          })();
        }
        return true
      }
    );

  }

  async lockAccount() {
    const nabox = await getStorage("nabox", {});
    if (nabox.currentAccount) {
      nabox.lock = true;
      ExtensionPlatform.set({nabox});
    }
  }

  //连接插件
  async createSession(type, domain, data, sendResponse) {
    const defaultAccount = await getSelectedAccount();
    const nabox = await getStorage("nabox", {});
    const network = await getStorage("network", nabox.network ? nabox.network : 'main');
    if (!defaultAccount) {
      sendResponse({type, payload: "No account available", status: false});
      return;
    }
    const chain = nabox.chain || "Ethereum";
    const chainId = nabox.chainId || "0x1";
    const defaultAddress = defaultAccount[network][chain];
    const allowSites = nabox.allowSites || [];
    let approvedDomain;
    if (allowSites.length !== 0) {
      approvedDomain = allowSites.filter(site => site.origin === domain)[0];
    }
    if (approvedDomain && approvedDomain.approvedList && approvedDomain.approvedList.length) { //已经授权过直接返回之前数据
      const approvedAddressList = approvedDomain.approvedList
      const account = approvedAddressList.filter(item => item.address === defaultAddress)[0] || approvedAddressList[0];
      sendResponse({type, status: true, payload: { address: account.address, chainId }});
    } else {
      this.openApproved(type, domain, data, sendResponse)
    }
  }

  //授权
  async openApproved(type, domain, data, sendResponse) {
    NotificationService.open(
      new Prompt(typeToPath[type], domain, data, async approvedList => {
        /* if (res) {
          sendResponse({ type, status: true, payload: res });
        } else {
          sendResponse({type, status: false, payload: "User rejected the request"});
        } */
        const nabox = await getStorage("nabox", {});
        const allowSites = nabox.allowSites || [];
        
        if (approvedList && approvedList.length !== 0) {
          const network = nabox.network;
          const defaultAccount = await getSelectedAccount();
          const chain = nabox.chain || "Ethereum";
          const chainId = nabox.chainId || "0x1";
          const defaultAddress = defaultAccount[network][chain];
          // 如果授权的账户中包含当前账户，则返回当前账户
          const accountInfo = approvedList.filter(item => item.address === defaultAddress)[0] || approvedList[0];
          sendResponse({ type, status: true, payload: { address: accountInfo.address, chainId } });
          
          const approvedIndex = allowSites.findIndex(v => v.origin === domain)
          if (approvedIndex > -1) {
            allowSites[approvedIndex].approvedList = approvedList
          } else {
            allowSites.push({
              origin: domain,
              approvedList: approvedList,
            });
          }
          nabox.allowSites = allowSites;
          ExtensionPlatform.set({nabox});
        } else {
          sendResponse({type, status: false, payload: "User rejected the request"});
        }
      })
    );
  }

  //发送交易
  async sendTransaction(type, domain, data, sendResponse) {
    NotificationService.open(
      new Prompt(typeToPath[type], domain, data, res => {
        if (res) {
          if (res.success) {
            sendResponse({type, status: true, payload: res.data});
          } else {
            sendResponse({type, status: false, payload: res.data});
          }
        } else {
          sendResponse({type, status: false, payload: "User rejected the request"});
        }
      })
    );
  }

  //nuls 调用合约
  async contractCall(type, domain, data, sendResponse) {
    NotificationService.open(
      new Prompt(typeToPath[type], domain, data, res => {
        if (res) {
          if (res.success) {
            sendResponse({type, status: true, payload: res.data});
          } else {
            sendResponse({type, status: false, payload: res.data});
          }
        } else {
          sendResponse({type, status: false, payload: "User rejected the request"});
        }
      })
    );
  }

  //普通交易签名
  async signTransaction(type, domain, data, sendResponse) {
    NotificationService.open(
      new Prompt(typeToPath[type], domain, data, res => {
        if (res) {
          if (res.success) {
            sendResponse({type, status: true, payload: res.data});
          } else {
            sendResponse({type, status: false, payload: res.data});
          }
        } else {
          sendResponse({type, status: false, payload: "User rejected the request"});
        }
      })
    );
  }

  //发送跨链交易
  async sendCrossTransaction(type, domain, data, sendResponse) {
    const isValidCrossChain = await this.isValidCrossChain(data.toChain, domain);
    if (isValidCrossChain) {
      NotificationService.open(
        new Prompt(typeToPath[type], domain, data, res => {
          if (res) {
            if (res.success) {
              sendResponse({type, status: true, payload: res.data});
            } else {
              sendResponse({type, status: false, payload: res.data});
            }
          } else {
            sendResponse({type, status: false, payload: "User rejected the request"});
          }
        })
      );
    } else {
      sendResponse({type, status: false, payload: "Unsupported cross-chain transactions"});
    }
  }

  // 模拟metamask发起交易
  async sendEthTransaction(type, domain, data, sendResponse) {
    NotificationService.open(
      new Prompt(typeToPath[type], domain, data, res => {
        if (res) {
          if (res.success) {
            sendResponse({type, status: true, payload: res.data});
          } else {
            sendResponse({type, status: false, payload: res.data});
          }
        } else {
          sendResponse({type, status: false, payload: "User rejected the request"});
        }
      })
    );
  }

  //hash签名
  async signHashTransaction(type, domain, data, sendResponse) {
    NotificationService.open(
      new Prompt(typeToPath[type], domain, data, res => {
        if (res) {
          if (res.success) {
            sendResponse({type, status: true, payload: res.data});
          } else {
            sendResponse({type, status: false, payload: res.data});
          }
        } else {
          sendResponse({type, status: false, payload: "User rejected the request"});
        }
      })
    );
  }

  //交易签名
  async transactionSerialize(type, domain, data, sendResponse) {
    const nabox = await getStorage("nabox", {});
    if (nabox.chain !== "NULS" && nabox.chain !== "NERVE") {
      sendResponse({type, status: false, payload: "TransactionSerialize can only be used on NULS or NERVE"});
      return
    }
    NotificationService.open(
      new Prompt(typeToPath[type], domain, data, res => {
        if (res) {
          if (res.success) {
            sendResponse({type, status: true, payload: res.data});
          } else {
            sendResponse({type, status: false, payload: res.data});
          }
        } else {
          sendResponse({type, status: false, payload: "User rejected the request"});
        }
      })
    );
  }

  // 是否授权
  async isAuthorized(url) {
    const nabox = await getStorage("nabox", {});
    const allowSites = nabox.allowSites || [];
    const Authorized = allowSites.filter(site => {
      return site.origin === url;
    })[0];
    // console.log(url, "是否授权", Authorized)
    return Authorized;
  }

  /**
   * @disc: 获取账户资产列表
   * @params: data
   * @date: 2021-03-09 15:18
   * @author: Wave
   */
  async assetsList(type, url, data, sendResponse) {
    let chain = data.chain;
    let address = data.address;
    const resData = await request({
      url: "/wallet/address/assets",
      data: {chain, address}
    });
    if (resData.code === 1000) {
      sendResponse({type, status: true, payload: resData.data});
    } else {
      sendResponse({type, status: false, payload: resData.msg});
    }
  }

  /**
   * @disc: 获取账户余额
   * @params: data
   * @date: 2021-03-09 15:18
   * @author: Wave
   */
  async getBalance(type, url, data, sendResponse) {
    /* const {chain, address, chainId, assetId} = data;
    const balance = await getBalances(chain, address, chainId, assetId);
    sendResponse({type, status: true, payload: balance}); */
    sendResponse({type, status: false, payload: "Not support yet"});
  }

  /**
   * @disc: 获取账户公钥
   * @params: data
   * @date: 2021-03-09 15:18
   * @author: Wave
   */
  async getPub(type, domain, data, sendResponse) {
    const nabox = await getStorage("nabox", {});
    const origin = nabox.allowSites.find(v => v.origin === domain);
    const approvedList = origin.approvedList || [];
    const alreadyAuth = approvedList.find(v=>v.address === data.address);

    if (alreadyAuth) {
      const localStore = await ExtensionPlatform.get();
      const { chain, network } = nabox;
      const accountList = localStore.accountList || [];
      const account = accountList.find(v => v[network][chain] === alreadyAuth.address);
      if (account) {
        sendResponse({type, status: true, payload: account.pub});
      } else {
        sendResponse({type, status: false, payload: "Unknown error"});
      }
    } else {
      sendResponse({type, status: false, payload: "The account is not connected to the plugin"});
    }
  }

  /**
   * @disc: hex签名
   * @params: data
   * @date: 2021-04-06 14:42
   * @author: Wave
   */
  async signHex(type, domain, data, sendResponse) {
    NotificationService.open(
      new Prompt(typeToPath[type], domain, data, res => {
        if (res) {
          if (res.success) {
            sendResponse({type, status: true, payload: res.data});
          } else {
            sendResponse({type, status: false, payload: res.data});
          }
        } else {
          sendResponse({type, status: false, payload: "User rejected the request"});
        }
      })
    );
  }

  /**
   * @disc: 断开连接
   * @params: data
   * @date: 2021-03-09 15:18
   * @author: Wave
   */
  async offLink(data) {
    const nabox = await getStorage("nabox", {});
    const allowSites = nabox.allowSites
    for (let item of allowSites) {
      if (item.origin === data.url) {
        const existIndex = item.approvedList.findIndex(v => v.address === data.address);
        if (existIndex > -1) {
          if (item.approvedList.length > 1) {
            item.approvedList.splice(existIndex, 1)
          } else {
            item.approvedList = [];
          }
        }
        /* let newList = item.approvedList.filter(obj => obj.address !== data.address);
        item.approvedList = [];
        item.approvedList = newList; */
      }
    }
    /* let newllowSites = nabox.allowSites.filter(obj => obj.approvedList.length !== 0);
    nabox.allowSites = newllowSites; */
    nabox.allowSites = allowSites;
    console.log(nabox, 666)
    ExtensionPlatform.set({nabox});
    // return true;
  }

  /**
   * @disc: 根据url判断是否授权
   * @params: data
   * @date: 2021-03-09 15:18
   * @author: Wave
   */
  async isAuthorizationByUrl(type, domain, data, sendResponse) {
    const nabox = await getStorage("nabox", {});
    let newList = nabox.allowSites.filter(obj => obj.origin === domain);
    if (newList.length !== 0) {
      sendResponse({type, status: true, payload: newList[0]});
    } else {
      sendResponse({type, status: false, payload: newList});
    }
  }

  // 验证跨链网络是否支持
  async isValidCrossChain(toChain, domain) {
    if (toChain) {
      // eth 跨链转入nerve 参数中的data解析？？
      const validCrossChain = [
        "NULS-NERVE",
        "NERVE-NULS",
        "NERVE-Ethereum",
        "NERVE-BSC",
        "NERVE-Heco",
        /*
        "Ethereum-NERVE",
        "BSC-NERVE",
        "Heco-NERVE"
         */
      ];
      const fromChain = (await this.isAuthorized(domain)).chain;
      const chain = fromChain + "-" + toChain;
      if (validCrossChain.indexOf(chain) > -1) {
        return true;
      }
      return false;
    }
    return false;
  }

  /**
   * @disc: 接口透传 eth_getBalance、eth_getCode、eth_call、eth_estimateGas、eth_getTransactionByHash
   * @params: data = {  chain (Ethereum、BSC、OKExChain、Heco) method  以太坊接口名 args []接口参数 }
   * @date: 2021-03-09 15:18
   * @author: Wave
   */
  async ethCall(type, url, data, sendResponse) {
    const nabox = await getStorage("nabox", {});
    data.chain = nabox.chain;
    try {
      const resData = await request({url: "/api/ethCall", data: data});
      if (resData.result) {
        sendResponse({type, status: true, payload: {id: data.id, result: resData.result}});
      } else {
        sendResponse({type, status: true, payload: {id: data.id, result: resData.error}});
      }
    } catch (e) {
      sendResponse({type, status: false, payload: {id: data.id, result: e}});
    }
    
  }

   /**
   * @desc signMessage
   * @params data
   */
    async signMessage(type, domain, data, sendResponse) {
      NotificationService.open(
        new Prompt(typeToPath[type], domain, data, res => {
          if (res) {
            if (res.success) {
              sendResponse({type, status: true, payload: res.data});
            } else {
              sendResponse({type, status: false, payload: res.data});
            }
          } else {
            sendResponse({type, status: false, payload: "User rejected the request"});
          }
        })
      );
    }

  /**
   * @desc nuls 查看合约
   * @param {object} data
   * @param {string} data.contractAddress // 合约地址
   * @param {string} data.methodName // 合约方法
   * @param {string} data.methodDesc // 方法描述
   * @param {array} data.args // 合约参数
   */
    async invokeView(type, domain, data, sendResponse) {
      const res = await request({url: "/contract/invokeView", data: data});
      if (res.code === 1000) {
        sendResponse({type, status: true, payload: res.data});
      } else {
        sendResponse({type, status: false, payload: res.msg});
      }
    }
}

new Background();

/*
//与content长连接
chrome.runtime.onConnect.addListener(function (port) {
  console.log(port, 665566);
  if (port.name === "new_popup_page") {
    port.onDisconnect.addListener(function (e) {
      console.log(e, 6666);
    });
  }
});

//向content-script发送消息，监听content的响应
chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
  console.log(tabs, "===tabs===");
  if (tabs.length) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      {greeting: "hello, i am background"},
      function (response) {
        if (response) {
          console.log(response.farewell);
        }
      }
    );
  }
});
*/



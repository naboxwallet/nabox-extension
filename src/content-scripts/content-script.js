/* eslint-disable prettier/prettier */
//直接注入页面的JS,可以获得浏览器所访问的web页面的详细信息，并可以通过操作DOM对页面做出修改,
//content-scripts和原始页面共享DOM，但是不共享JS，如要访问页面JS（例如某个JS变量），只能通过injected js来实现。
/* 
chrome.extension(getURL , inIncognitoContext , lastError , onRequest , sendRequest)
chrome.i18n
chrome.runtime(connect , getManifest , getURL , id , onConnect , onMessage , sendMessage)
chrome.storage
*/

import { getStorage, getSelectedAccount } from "@/utils/util";

const INJECTION_SCRIPT_FILENAME = "js/inPage.js"

function strippedFavicon() {
  let favicon = undefined;
  let nodeList = document.getElementsByTagName("link");
  for (let i = 0; i < nodeList.length; i++){
    if((nodeList[i].getAttribute("rel") == "icon")||(nodeList[i].getAttribute("rel") == "shortcut icon")){
      favicon = nodeList[i].getAttribute("href");
      break;
    }
  }

  if(favicon && favicon.substring(0,1) === '/'){
    favicon = location.origin + favicon;
  }
  return favicon;
};


class Content {
  constructor() {
    this.injectScript();
    
    this.injectInteractionScript();
  }

  // 向web注入inPage.js
  injectScript() {
    /*
    const fs = require('fs');
    const path = require("path");
    console.log(fs, '===fs', path)
    const inpageContent = fs.readFileSync(path.resolve(__dirname, "./dist/js/inPage.js"), "utf8")
    const inpageSuffix = '//# sourceURL=' + chrome.runtime.getURL("inpage.js") + "\n";
    const inpageBundle = inpageContent + inpageSuffix
    injectScript(inpageBundle);
    */
    const head = document.head || document.documentElement;
    const script = document.createElement("script");
    script.setAttribute("async", "false");
    script.src = chrome.extension.getURL(INJECTION_SCRIPT_FILENAME)
    head.insertBefore(script, head.children[0]);
    head.removeChild(script);
  }

  async injectInteractionScript() {
    // 注入naboxBridge到页面
    // this.injectState();

    // 监听inPage发来的消息
    this.addListenerFromInPage();

    // 监听storage变化
    this.listenStorageChange();
  }

  async injectState() {
    const defaultAccount = await getSelectedAccount();
    const defaultNetwork = await getStorage("network", []);
    const naboxBridge = await getStorage("naboxBridge", {});
    let selectedAccount = null;
    if (naboxBridge.allowSites && naboxBridge.allowSites.length) {
      const authorized = naboxBridge.allowSites.filter(site => site === location.origin)[0]
      if (authorized) {
        selectedAccount = defaultAccount;
      }
    }
    window.postMessage({
      type: "injectState",
      status: true,
      payload: {
        accounts: selectedAccount,
        chainId: defaultNetwork
      }
    });
  }

  addListenerFromInPage() {
    window.addEventListener("message", async (e) =>{
      // console.log(e, '====e====')
      const targetOrigin = location.origin;
      if (e.source !== window) return;
      if (e.origin !== targetOrigin) return;

      const data = JSON.parse(JSON.stringify(e.data));
      if (data.method === "injectState") {
        this.injectState();
      } else {
        // 提供的api
        const methods = ["createSession", "getBalance"]
        const msg = {
          type: data.method,
          url: targetOrigin,
        }
        if (data.method === "createSession") {
          const icon = strippedFavicon()
          msg.icon = icon
        }
        if (methods.indexOf(data.method) > -1) {
          //发送消息到background，并将后台返回的数据传递给inPage
          chrome.runtime.sendMessage(msg, (response) => {
            e.source.postMessage(response)
          })
        }
      }
      
      /* if (data.method === "connect") {
        chrome.runtime.sendMessage({
          type: "connect",
          url: targetOrigin
        }, (response) => {
          e.source.postMessage(response)
        })
      } else if (data.method === "getBalance") {
        chrome.runtime.sendMessage({
          type: "getBalance",
        })
      } else if (data.method === "injectState") {
        const accountList = await this.getStorage("accountList", []);
        const defaultAccount = accountList.filter(account => account.selection)[0]
        const defaultNetwork = await this.getStorage("network", []);
        const naboxBridge = await this.getStorage("naboxBridge", {});
        let betaAccount = null, mainAccount = null, network = "";
        if (naboxBridge.allowSites && naboxBridge.allowSites.length) {
          const authorized = naboxBridge.allowSites.filter(site => {
            site.origin === e.source && site.status;
          })[0]
          if (authorized) {
            betaAccount = defaultAccount.beta;
            mainAccount = defaultAccount.main;
            network = defaultNetwork
          }
        }
        e.source.postMessage({
          type: "injectState", 
          selectedAccount: {
            beta: betaAccount,
            main: mainAccount,
          },
          network
        })
      } */
    });
  }

  listenStorageChange() {
    //监听授权网址、网络、选中账户变化
    chrome.storage.onChanged.addListener(async (changes, namespace) => {
      if (!changes.naboxBridge) return;
      const newValue = changes.naboxBridge.newValue || {};
      const oldValue = changes.naboxBridge.oldValue || {};
      // const naboxBridge = await getStorage("naboxBridge", {});
      // console.log(naboxBridge, 8899, newValue, 999,oldValue)
      /* const allowSites = naboxBridge.allowSites;
      console.log(allowSites, 111, newValue.allowSites, 123, oldValue.allowSites, 456, newValue.allowSites===oldValue.allowSites)
      if (newValue.allowSites !== oldValue.allowSites) {

      } */

      this.checkConnected(newValue.allowSites, oldValue.allowSites);

      this.checkCurrentAccount(newValue.currentAccount, oldValue.currentAccount);

      this.checkNetwork(newValue.network, oldValue.network);
    })
  }

  async checkConnected(newSites = [], oldSites = []) {
    console.log(newSites, 123456, oldSites)

    if (newSites.length !== oldSites.length) {
      // 连接网站修改
      const authorizedNow = newSites.filter(site => {
        return site === location.origin;
      })[0];
      const authorizedBefore = oldSites.filter(site => {
        return site === location.origin;
      })[0];
      console.log(authorizedNow, "authorizedNow")
      if (authorizedNow) {
        if (authorizedNow !== authorizedBefore) {
          const defaultAccount = await getSelectedAccount();
          const network = await getStorage("network", "")
          window.postMessage({
            type: "connect",
            payload: {
              accounts: authorizedNow ? defaultAccount : null,
              chainId: network
            }
          }, location.origin);
        }
      } else {
        window.postMessage({
          type: "disconnect"
        }, location.origin);
      }
      
    }
  }
  async checkCurrentAccount(newAccount = {}, oldAccount = {}) {
    // console.log(newAccount, 456, oldAccount)
    if (newAccount.pub !== oldAccount.pub) {
      const defaultAccount = await getSelectedAccount();
      console.log(newAccount.beta.NULS, "====currentAccount====", defaultAccount.beta.NULS)
      const network = await getStorage("network", "")
      window.postMessage({
        type: "session_update",
        payload: {
          accounts: defaultAccount,
          chainId: network
        }
      }, location.origin);
    }
  }

  async checkNetwork(newNetwork, oldNetwork) {
    // console.log(newNetwork, 789, oldNetwork)
    if (newNetwork !== oldNetwork) {
      const defaultAccount = await getSelectedAccount();
      window.postMessage({
        type: "session_update",
        payload: {
          accounts: defaultAccount,
          chainId: newNetwork
        }
      }, location.origin);
    }
  }
}

new Content()

//与background建立长连接
/* const port = chrome.runtime.connect({ name: "nabox_wallet_channel" });
port.onMessage.addListener(function(msg) {
  if (msg.type === "Authorization") {
    window.postMessage({
      type: "Authorization",
      data: 123465
    })
  } else if (msg.type === "getBalance") {
    window.postMessage({
      type: "getBalance",
      data: 123465123465
    })
  }
}); */


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
import { isEqual } from "lodash";
import { config } from "@/config";
console.log("load--------------")
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
    // 监听inPage发来的消息
    this.addListenerFromInPage();

    // 监听storage变化
    this.listenStorageChange();
  }

  async injectState() {
    const payload = await this.getAccountChainId()
    window.postMessage({
      type: "injectState",
      status: true,
      payload
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
        const methods = [
          "createSession",
          "getBalance",
          "sendTransaction",
          "sendCrossTransaction",
          "signTransaction",
          "signCrossTransaction"
        ]
        const msg = {
          type: data.method,
          data: data.data,
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
    });
  }

  listenStorageChange() {
    //监听授权网址、网络、选中账户变化
    chrome.storage.onChanged.addListener(async (changes, namespace) => {
      if (!changes.nabox) return;
      const newValue = changes.nabox.newValue || {};
      const oldValue = changes.nabox.oldValue || {};
      if (!isEqual(newValue.allowSites, oldValue.allowSites)) {
        this.checkConnected(newValue.allowSites, oldValue.allowSites);
      } else if (!isEqual(newValue.currentAccount, oldValue.currentAccount)) {
        this.checkCurrentAccount(newValue.currentAccount, oldValue.currentAccount);
      } else if (!isEqual(newValue.network, oldValue.network)) {
        this.checkNetwork(newValue.network, oldValue.network);
      }
    })
  }

  async checkConnected(newSites = [], oldSites = []) {
    // 连接网站修改
    const authorizedNow = newSites.filter(site => {
      return site.origin === location.origin;
    })[0];
    const authorizedBefore = oldSites.filter(site => {
      return site.origin === location.origin;
    })[0];
    if (authorizedNow) {
      if (authorizedNow !== authorizedBefore) {
        const payload = await this.getAccountChainId()
        window.postMessage({
          type: "connect",
          payload
        }, location.origin);
      }
    } else {
      window.postMessage({
        type: "disconnect",
        payload: {}
      }, location.origin);
    }
  }
  async checkCurrentAccount(newAccount = {}, oldAccount = {}) {
    console.log(newAccount, "===", oldAccount)
    if (newAccount.pub !== oldAccount.pub) {
      const payload = await this.getAccountChainId()
      window.postMessage({
        type: "session_update",
        payload
      }, location.origin);
    }
  }

  async checkNetwork(newNetwork, oldNetwork) {
    if (newNetwork !== oldNetwork) {
      const payload = await this.getAccountChainId()
      window.postMessage({
        type: "session_update",
        payload
      }, location.origin);
    }
  }

  async getAccountChainId() {
    const defaultAccount = await getSelectedAccount();
    const network = await getStorage("network", "");
    const nabox = await getStorage("nabox", {});
    const sites = nabox.allowSites || [];
    const authorizedSite = sites.filter(site => {
      return site.origin === location.origin;
    })[0];
    const accounts = authorizedSite
      ? [defaultAccount[network][authorizedSite.chain]]
      : [];
    const chainId = authorizedSite
      ? config[network].chainInfo[authorizedSite.chain]
      : config[network].chainInfo.NULS;
    return {
      accounts,
      chainId
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


/* eslint-disable prettier/prettier */
//直接注入页面的JS,可以获得浏览器所访问的web页面的详细信息，并可以通过操作DOM对页面做出修改,
//content-scripts和原始页面共享DOM，但是不共享JS，如要访问页面JS（例如某个JS变量），只能通过injected js来实现。
/* 
chrome.extension(getURL , inIncognitoContext , lastError , onRequest , sendRequest)
chrome.i18n
chrome.runtime(connect , getManifest , getURL , id , onConnect , onMessage , sendMessage)
chrome.storage
*/
import ExtensionPlatform from "@/utils/extension";

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

  injectInteractionScript() {
    // 注入naboxBridge到页面
    // this.injectState();

    // 监听inPage发来的消息
    this.addListenerFromInPage();

    // 监听storage变化
    this.listenStorageChange();
  }

  async injectState() {
    const defaultAccount = await this.getDefaultAccount();
    const defaultNetwork = await this.getStorage("network", []);
    const naboxBridge = await this.getStorage("naboxBridge", {});
    let selectedAccount = null
    if (naboxBridge.allowSites && naboxBridge.allowSites.length) {
      const authorized = naboxBridge.allowSites.filter(site => {
        site.origin === location.origin;
      })[0]
      if (authorized) {
        selectedAccount = defaultAccount;
      }
    }
    window.postMessage("message", {
      type: "injectState",
      payload: {
        selectedAccount,
        network: defaultNetwork
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
      
      const methods = ["connect", "getBalance", "injectState"]
      const msg = {
        type: data.method,
        url: targetOrigin,
      }
      if (data.method === "connect") {
        const icon = strippedFavicon()
        msg.icon = icon
      }
      if (methods.indexOf(data.method) > -1) {
        //发送消息到background，并将后台返回的数据传递给inPage
        chrome.runtime.sendMessage(msg, (response) => {
          e.source.postMessage(response)
        })
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
    }, false);
  }

  listenStorageChange() {
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      if (!changes.naboxBridge) return;
      const newValue = changes.naboxBridge.newValue || {};
      const oldValue = changes.naboxBridge.oldValue || {};
      console.log(newValue, "====----====", oldValue)
      if (newValue.allowSites && newValue.allowSites !== oldValue.allowSites) {
        // 连接网站修改
        const allowSites = newValue.allowSites;
        const currentSite = allowSites.filter(site => {
          return site.origin === location.origin;
        })[0];
        window.postMessage({
          type: "connect",
          selectedAccount: currentSite.selectedAccount,
          network: currentSite.network,
          status: currentSite.status
        }, location.origin);
      } else if (newValue.currentAccount.id !== oldValue.currentAccount.id) {
        console.log(newValue.currentAccount, "currentAccount")
      } else if (newValue.network !== oldValue.network) {
        console.log(newValue.network, "network")
      }
      
    })
  }

  async getDefaultAccount() {
    const accountList = await this.getStorage("accountList", []);
    const currentAccount = accountList.filter(account => account.selection)[0];
    const defaultAccount = currentAccount
      ? {
          beta: currentAccount.beta,
          main: currentAccount.main
        }
      : null;
    return defaultAccount;
  }

  async getStorage(key, defaultValue) {
    return (await ExtensionPlatform.get(key))[key] || defaultValue
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


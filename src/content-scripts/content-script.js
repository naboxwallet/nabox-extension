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

class Content {
  constructor() {
    this.injectScript();
    
    this.injectInteractionScript();
    /* setTimeout(()=>{
      // this.injectExtensionState();
    },1000) */
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

  // 注入插件当前选中账户、网络到web page
  /* async injectExtensionState() {
    console.log(555)
    const accountList = await this.getStorage("accountList", []);
    const defaultAccount = accountList.filter(account => account.selection)[0]
    const network = await this.getStorage("network", []);
    console.log(defaultAccount, network, 55665566)
    window.postMessage({
      type: "injectState",
      currentAccount: defaultAccount,
      network
    })
  } */

  // 添加交互事件脚本
  injectInteractionScript() {
    // 监听inPage发来的消息
    this.addListenerFromInPage();
    // 监听storage变化
    this.listenStorageChange();
  }

  addListenerFromInPage() {
    window.addEventListener("message", async (e) =>{
      const targetOrigin = location.origin;
      if (e.source !== window) return;
      if (e.origin !== targetOrigin) return;

      const data = JSON.parse(JSON.stringify(e.data));
      if (data.method === "connect") {
        const allowSites = (await ExtensionPlatform.get("allowSites")).allowSites || [];
        console.log(allowSites, 888)
        const Authorized = allowSites.filter(site => {
          return site.origin === targetOrigin && site.address
        });
        if (Authorized.length) {
          //已经授权过直接返回之前数据
          e.source.postMessage({
            type: "connect",
            address: Authorized[0].address
          })
        } else {
          chrome.runtime.sendMessage({
            type: "connect",
            url: targetOrigin
          })
        }
        
      } else if (data.method === "getBalance") {
        chrome.runtime.sendMessage({
          type: "getBalance",
        })
      } else if (data.method === "injectState") {
        console.log("injectState")
        const accountList = await this.getStorage("accountList", []);
        const defaultAccount = accountList.filter(account => account.selection)[0]
        const network = await this.getStorage("network", []);
        console.log(defaultAccount, network, 55665566)
        /* e.source.postMessage({
          type: "injectState",
          currentAccount: defaultAccount,
          network
        }) */
        // await this.injectExtensionState()
      }
    }, false);
  }

  listenStorageChange() {
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      const newValue = changes.naboxBridge.newValue;
      const oldValue = changes.naboxBridge.oldValue;
      if (newValue.allowSites !== oldValue.allowSites) {
        // 连接网站修改
        const allowSites = newValue.allowSites;
        const currentSite = allowSites.filter(site => {
          return site.origin = location.origin;
        })[0];
        window.postMessage({
          type: "connect",
          address: currentSite.address,
          network: currentSite.network
        }, location.origin);
      } else if (newValue.currentAccount.id !== oldValue.currentAccount.id) {
        console.log(newValue.currentAccount, "currentAccount")
      } else if (newValue.network !== oldValue.network) {
        console.log(newValue.network, "network")
      }
      
    })
  }

  async getStorage(key, defaultValue) {
    return (await ExtensionPlatform.get(key))[key] || defaultValue
  }
}

new Content()

//发送消息到background.js
// chrome.runtime.sendMessage({ greeting: "hello, i am content" }, function(response) {
//   console.log(response.greeting, "---content-script");
// });

//接受从background.js发来的消息 并作出回应，chrome.windows.create创建的新窗口中无法监听
/* chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type === "connect") {
    window.postMessage({
      type: "connect",
      data: 123465
    })
    sendResponse({farewell: "goodbye"});
    console.log(request, "====request===")
  }
}); */




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


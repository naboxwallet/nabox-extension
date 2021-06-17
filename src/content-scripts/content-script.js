//直接注入页面的JS,可以获得浏览器所访问的web页面的详细信息，并可以通过操作DOM对页面做出修改,
//content-scripts和原始页面共享DOM，但是不共享JS，如要访问页面JS（例如某个JS变量），只能通过injected js来实现。
import { getStorage, getCurrentAuthAccount } from "@/utils/util";
import ExtensionPlatform from "@/utils/extension";
import {isEqual} from "lodash";

const INJECTION_SCRIPT_FILENAME = "js/inPage.js";

function strippedFavicon() {
  let favicon = undefined;
  let nodeList = document.getElementsByTagName("link");
  for (let i = 0; i < nodeList.length; i++) {
    if ((nodeList[i].getAttribute("rel") === "icon") || (nodeList[i].getAttribute("rel") === "shortcut icon")) {
      favicon = nodeList[i].getAttribute("href");
      break;
    }
  }

  if (favicon && favicon.substring(0, 1) === '/') {
    favicon = location.origin + favicon;
  }
  return favicon;
}

function doctypeCheck() {
  const { doctype } = window.document;
  if (doctype) {
    return doctype.name === 'html';
  }
  return true;
}

function documentElementCheck() {
  const documentElement = document.documentElement.nodeName;
  if (documentElement) {
    return documentElement.toLowerCase() === 'html';
  }
  return true;
}

function suffixCheck() {
  const prohibitedTypes = [/\.xml$/u, /\.pdf$/u];
  const currentUrl = window.location.pathname;
  for (let i = 0; i < prohibitedTypes.length; i++) {
    if (prohibitedTypes[i].test(currentUrl)) {
      return false;
    }
  }
  return true;
}

class Content {
  constructor() {
    if (doctypeCheck() && documentElementCheck() && suffixCheck()) {
      this.injectScript();
    }
    this.injectInteractionScript();
  }

  // 向web注入inPage.js
  injectScript() {
    const head = document.head || document.documentElement;
    const script = document.createElement("script");
    script.setAttribute("async", "false");
    script.src = chrome.extension.getURL(INJECTION_SCRIPT_FILENAME);
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
    const payload = await this.getAccountChainId();
    window.postMessage({
      type: "injectState",
      status: true,
      payload
    });
  }

  addListenerFromInPage() {
    window.addEventListener("message", async (e) => {
      const targetOrigin = location.origin;
      // this.origin = location.origin;
      if (e.source !== window) return;
      if (e.origin !== targetOrigin) return;
      if (!e.data) return;
      const data = JSON.parse(JSON.stringify(e.data));
      if (data.method === "injectState") {
        this.injectState();
      } else {
        // 提供的api
        const methods = [
          "createSession",
          "getBalance",
          "sendTransaction",
          "contractCall",
          "sendCrossTransaction",
          "sendEthTransaction",
          "signTransaction",
          "signHex",
          "signCrossTransaction",
          "signHashTransaction",
          "transactionSerialize",
          "assetsList",
          "ethCall",
          "getPub",
          "offLink",
          "isAuthorizationByUrl",
          "signMessage",
          "invokeView",
        ];
        const msg = {
          type: data.method,
          data: data.data,
          url: targetOrigin,
        };
        if (data.method === "createSession") {
          const icon = strippedFavicon();
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
    chrome.storage.onChanged.addListener(async (changes) => {
      if (!changes.nabox) return;
      const newValue = changes.nabox.newValue || {};
      const oldValue = changes.nabox.oldValue || {};
      const specialChain = newValue.chainId === "0x0" && oldValue.chainId === "0x0" && newValue.chain === oldValue.chain
      if (!isEqual(newValue.allowSites, oldValue.allowSites)) {
        this.checkConnected(newValue.allowSites, oldValue.allowSites);
      } else if (!isEqual(newValue.currentAccount, oldValue.currentAccount)) {
        this.checkCurrentAccount(newValue.currentAccount, oldValue.currentAccount);
      } /* else if (!isEqual(newValue.network, oldValue.network)) {
        this.checkNetwork(newValue.network, oldValue.network);
      } */ else if (!isEqual(newValue.lock, oldValue.lock)) {
        this.checkLock(newValue.lock, oldValue.lock);
      } else if (!isEqual(newValue.chain, oldValue.chain) || !isEqual(newValue.chainId, oldValue.chainId) || specialChain) {
        this.checkChain(newValue.chainId)
      }
    })
  }

  async checkConnected(newSites = [], oldSites = []) {
    // 连接网站修改
    const authorizedNow = newSites.filter(site => {
      return site.origin === location.origin;
      // return site.origin === this.origin;
    })[0];
    const authorizedBefore = oldSites.filter(site => {
      return site.origin === location.origin;
      // return site.origin === this.origin;
    })[0];

    if (authorizedNow) {
      // const newApprovedList = authorizedNow && authorizedNow.approvedList;
      // const oldApprovedList = authorizedBefore && authorizedBefore.approvedList;
      const payload = await this.getAccountChainId();
      window.postMessage({ type: "accountsChanged", payload }, location.origin);

      /* if (!authorizedBefore || oldApprovedList && oldApprovedList.length === 0) {
        // 初次连接
        // console.log("----connect----")
        window.postMessage({ type: "accountsChanged", payload }, location.origin);
      } else if (newApprovedList && oldApprovedList && newApprovedList.length === 0 && oldApprovedList.length !== 0) {
        // 所有连接的账户都断开
        // console.log("----disconnect----")
        window.postMessage({ type: "accountsChanged", payload }, location.origin);
      } else if (newApprovedList && oldApprovedList && newApprovedList.length !== oldApprovedList.length) {
        // 断开当前连接账户，授权账户还有账户仍处于连接状态
        window.postMessage({type: "accountsChanged", payload }, location.origin);
      } */
    }
  }

  async checkCurrentAccount(newAccount = {}, oldAccount = {}) {
    if (newAccount.pub !== oldAccount.pub) {
      const payload = await this.getAccountChainId();
      window.postMessage({
        type: "accountsChanged",
        payload
      }, location.origin);
    }
  }

  async checkNetwork(newNetwork, oldNetwork) {
    if (newNetwork !== oldNetwork) {
      const payload = await this.getAccountChainId();
      window.postMessage({
        type: "chainChanged",
        payload: payload.chainId
      }, location.origin);
    }
  }

  async checkLock(newLock, oldLock) {
    if (newLock !== oldLock) {
      const res = await this.getAccountChainId();
      let payload
      if (newLock) {
        payload = { address: "", chainId: res.chainId }
      } else {
        payload = res
      }
      window.postMessage({
        type: "accountsChanged",
        payload
      }, location.origin);
    }
  }

  // 所选链改变
  async checkChain(newChainId) {
    window.postMessage({
      type: "chainChanged",
      payload: newChainId
    });
    const localStore = await ExtensionPlatform.get();
    const { nabox, accountList } = localStore;
    const { chain, network } = nabox;
    // console.info(12345678987654321)
    nabox.allowSites.map(site => {
      if (site.origin === location.origin) {
        site.approvedList.map(account => {
            accountList.map(v => {
              if (v.id === account.accountId) {
                account.address = v[network][chain]
              }
            })
        })
      }
    })
    ExtensionPlatform.set({ nabox })
  }

  // 当前连接的授权账户
  async getAccountChainId() {
    const nabox = await getStorage("nabox", {});
    const sites = nabox.allowSites || [];
    const authorizedSite = sites.filter(site => {
      return site.origin === location.origin
    })[0];
    if (!authorizedSite) {
      return { address: null, chainId: "" }
    }
    const approvedList = authorizedSite ? authorizedSite.approvedList : []
    const payload = await getCurrentAuthAccount(approvedList);
    return payload;
  }
}

new Content();


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


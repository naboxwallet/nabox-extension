import ExtensionPlatform from "@/utils/extension";
import NotificationService from "@/utils/NotificationService";

class Prompt {
  constructor(routePath = "", domain = "", data = {}, responder = null) {
    this.routePath = routePath;
    this.domain = domain;
    this.data = data;
    this.responder = responder;
  }
}

const typeToPath = {
  connect: "/authorization"
};

class Background {
  constructor() {
    this.addListener();
  }

  addListener() {
    // 监听content发来的消息，处理后再返回给content
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === "injectState") {
        this.injectState(request.type, request.url, sendResponse);
      } else if (request.type === "connect") {
        this.connect(request.type, request.url, request.icon, sendResponse);
      }
    });
  }

  async injectState(type, domain, sendResponse) {
    const defaultAccount = await this.getDefaultAccount();
    const defaultNetwork = await this.getStorage("network", []);
    const naboxBridge = await this.getStorage("naboxBridge", {});
    let selectedAccount = null
    if (naboxBridge.allowSites && naboxBridge.allowSites.length) {
      const authorized = naboxBridge.allowSites.filter(site => {
        site.origin === domain;
      })[0]
      if (authorized) {
        selectedAccount = defaultAccount;
      }
    }
    sendResponse({
      type,
      status: true,
      payload: {
        selectedAccount,
        network: defaultNetwork
      }
    });
  }

  async connect(type, domain, icon, sendResponse) {
    const defaultAccount = await this.getDefaultAccount();
    const naboxBridge = (await ExtensionPlatform.get("naboxBridge")).naboxBridge || {};
    const allowSites = naboxBridge.allowSites || [];
    const Authorized = allowSites.filter(site => {
      return site.origin === domain;
    })[0];
    if (Authorized) {
      //已经授权过直接返回之前数据
      sendResponse({
        type,
        payload: defaultAccount,
        status: true
      });
    } else {
      NotificationService.open(
        new Prompt(typeToPath[type], domain, { icon }, async approved => {
          const defaultAccount = await this.getDefaultAccount();
          if (approved) {
            sendResponse({
              type,
              status: true,
              payload: defaultAccount
            });
            allowSites.push(domain);
            naboxBridge.allowSites = allowSites;
            ExtensionPlatform.set({ naboxBridge });
          } else {
            sendResponse({
              type,
              status: false
            });
          }
        })
      );
    }
  }

  async getStorage(key, defaultValue) {
    return (await ExtensionPlatform.get(key))[key] || defaultValue;
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
}

new Background();

//向content-script发送消息，监听content的响应
/* chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
  console.log(tabs, "===tabs===")
  if (tabs.length) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { greeting: "hello, i am background" },
      function(response) {
        if (response) {
          console.log(response.farewell);
        }
      }
    );
  }
}); */

//与content长连接
chrome.runtime.onConnect.addListener(function(port) {
  if (port.name === "new_popup_page") {
    port.onDisconnect.addListener(function(e) {
      console.log(e, 6666);
    });
  }
});

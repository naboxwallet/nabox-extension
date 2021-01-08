import ExtensionPlatform from "@/utils/extension";
import NotificationService from "@/utils/NotificationService";
import { getStorage, getSelectedAccount } from "@/utils/util";

class Prompt {
  constructor(routePath = "", domain = "", data = {}, responder = null) {
    this.routePath = routePath;
    this.domain = domain;
    this.data = data;
    this.responder = responder;
  }
}

const typeToPath = {
  createSession: "/notification/authorization"
};

class Background {
  constructor() {
    this.addListener();
  }

  addListener() {
    // 监听content发来的消息，处理后再返回给content
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      const { type, url, icon } = request;
      if (type === "injectState") {
        // this.injectState(type, url, sendResponse);
      } else if (type === "createSession") {
        this.createSession(type, url, icon, sendResponse);
      }
    });
  }

  async injectState(type, domain, sendResponse) {
    const defaultAccount = await getSelectedAccount();
    const defaultNetwork = await getStorage("network", "");
    const naboxBridge = await getStorage("naboxBridge", {});
    let selectedAccount = null;
    if (naboxBridge.allowSites && naboxBridge.allowSites.length) {
      const authorized = naboxBridge.allowSites.filter(
        site => site.origin === domain
      )[0];
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

  async createSession(type, domain, icon, sendResponse) {
    const defaultAccount = await getSelectedAccount();
    const defaultNetwork = await getStorage("network", "");
    if (!defaultAccount) {
      sendResponse({
        type,
        payload: null,
        status: true
      });
      return;
    }
    const naboxBridge = await getStorage("naboxBridge", {}); //(await ExtensionPlatform.get("naboxBridge")).naboxBridge || {};
    const allowSites = naboxBridge.allowSites || [];
    const Authorized = allowSites.filter(site => {
      return site === domain;
    })[0];
    if (Authorized) {
      //已经授权过直接返回之前数据
      sendResponse({
        type,
        payload: {
          accounts: defaultAccount,
          chainId: defaultNetwork
        },
        status: true
      });
    } else {
      NotificationService.open(
        new Prompt(typeToPath[type], domain, { icon }, async approved => {
          if (approved) {
            const defaultAccount = await getSelectedAccount();
            const defaultNetwork = await getStorage("network", "");
            sendResponse({
              type,
              status: true,
              payload: {
                accounts: defaultAccount,
                chainId: defaultNetwork
              }
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
}

new Background();

/*
//与content长连接
chrome.runtime.onConnect.addListener(function(port) {
  if (port.name === "new_popup_page") {
    port.onDisconnect.addListener(function(e) {
      console.log(e, 6666);
    });
  }
});

//向content-script发送消息，监听content的响应
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
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
});
*/

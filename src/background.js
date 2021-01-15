import ExtensionPlatform from "@/utils/extension";
import NotificationService from "@/utils/NotificationService";
import { getStorage, getSelectedAccount } from "@/utils/util";
import { config } from "./config";

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
  sendCrossTransaction: "/notification/send-cross-transaction"
};

class Background {
  constructor() {
    this.addListener();
  }

  addListener() {
    // 监听content发来的消息，处理后再返回给content
    chrome.runtime.onMessage.addListener(
      async (request, sender, sendResponse) => {
        const { type, url, icon, data } = request;
        if (type === "createSession") {
          this.createSession(type, url, icon, sendResponse);
        } else {
          const isAuthorized = await this.isAuthorized(url);
          console.log(isAuthorized, 55, type)
          if (isAuthorized) {
            if (type === "sendTransaction" || type === "signTransaction") {
              this.sendTransaction(type, url, data, sendResponse);
            } else if (type === "sendCrossTransaction" || type === "signCrossTransaction") {
              this.sendCrossTransaction(type, url, data, sendResponse);
            }
          } else {
            sendResponse({
              type,
              status: false,
              payload: "Please connect the plugin first"
            });
          }
        }
      }
    );
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
    const nabox = await getStorage("nabox", {}); //(await ExtensionPlatform.get("nabox")).nabox || {};
    const allowSites = nabox.allowSites || [];
    const Authorized = allowSites.filter(site => {
      return site.origin === domain;
    })[0];
    if (Authorized) {
      //已经授权过直接返回之前数据
      sendResponse({
        type,
        payload: [defaultAccount[defaultNetwork][Authorized.chain]],
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
              payload: [defaultAccount[defaultNetwork][approved]]
            });
            allowSites.push({
              origin: domain,
              chain: approved
            });
            nabox.allowSites = allowSites;
            ExtensionPlatform.set({ nabox });
          } else {
            sendResponse({
              type,
              status: false,
              payload: "User rejected the request"
            });
          }
        })
      );
    }
  }
  async sendTransaction(type, domain, data, sendResponse) {
    NotificationService.open(
      new Prompt(typeToPath[type], domain, data, res => {
        if (res) {
          if (res.success) {
            sendResponse({
              type,
              status: true,
              payload: res.data
            });
          } else {
            sendResponse({
              type,
              status: false,
              payload: res.data
            });
          }
        } else {
          sendResponse({
            type,
            status: false,
            payload: "User rejected the request"
          });
        }
      })
    );
  }
  async sendCrossTransaction(type, domain, data, sendResponse) {
    const isValidCrossChain = await this.isValidCrossChain(data.toChain, domain);
    if (isValidCrossChain) {
      NotificationService.open(
        new Prompt(typeToPath[type], domain, data, res => {
          if (res) {
            if (res.success) {
              sendResponse({
                type,
                status: true,
                payload: res.data
              });
            } else {
              sendResponse({
                type,
                status: false,
                payload: res.data
              });
            }
          } else {
            sendResponse({
              type,
              status: false,
              payload: "User rejected the request"
            });
          }
        })
      );
    } else {
      sendResponse({
        type,
        status: false,
        payload: "Unsupported cross-chain transactions"
      });
    }
  }
  // 验证是否已连接插件
  async isAuthorized(domain) {
    const nabox = await getStorage("nabox", {});
    const allowSites = nabox.allowSites || [];
    const Authorized = allowSites.filter(site => {
      return site.origin === domain;
    })[0];
    return Authorized;
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
        /* "Ethereum-NERVE",
        "BSC-NERVE",
        "Heco-NERVE" */
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

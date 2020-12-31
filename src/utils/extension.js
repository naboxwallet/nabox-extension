import { checkForError } from "./util";

class ExtensionPlatform {
  getVersion() {
    return chrome.runtime.getManifest().version;
  }

  async get(key = null) {
    const local = chrome.storage.local;
    return new Promise((resolve, reject) => {
      local.get(key, result => {
        const err = checkForError();
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  async set(obj) {
    const local = chrome.storage.local;
    return new Promise((resolve, reject) => {
      local.set(obj, () => {
        const err = checkForError();
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async remove(key) {
    const local = chrome.storage.local;
    return new Promise((resolve, reject) => {
      local.remove(key, () => {
        const err = checkForError();
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async clear() {
    const local = chrome.storage.local;
    return new Promise((resolve, reject) => {
      local.clear(() => {
        const err = checkForError();
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  openTab(options) {
    return new Promise((resolve, reject) => {
      chrome.tabs.create(options, newTab => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve(newTab);
      });
    });
  }

  openWindow(options) {
    return new Promise((resolve, reject) => {
      chrome.windows.create(options, newTab => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve(newTab);
      });
    });
  }

  closeCurrentWindow() {
    return chrome.windows.getCurrent(windowDetails => {
      return chrome.windows.remove(windowDetails.id);
    });
  }

  openExtensionInBrowser(route = null, queryString = null) {
    let extensionURL = chrome.runtime.getURL("home.html");

    if (queryString) {
      extensionURL += `?${queryString}`;
    }

    if (route) {
      extensionURL += `#${route}`;
    }
    this.openTab({ url: extensionURL });
  }

  //弹窗显示交易
  showTransactionNotification(txMeta) {
    const { status } = txMeta;
    if (status === "confirmed") {
      this._showConfirmedTransaction(txMeta);
    } else if (status === "failed") {
      this._showFailedTransaction(txMeta);
    }
  }

  _showConfirmedTransaction(txMeta) {
    this._subscribeToNotificationClicked();
    console.log(txMeta);
    const url = "https://nulscan.io/"; //点击跳转地址
    const txHash = "我是成功hash";

    const title = "Confirmed transaction";
    const message = `Transaction ${txHash} confirmed! View on scan`;
    this._showNotification(title, message, url);
  }

  _showFailedTransaction(txMeta, errorMessage) {
    const txHash = "我是失败hash";
    const title = "Failed transaction";
    const message = `Transaction ${txHash} failed! ${errorMessage ||
      txMeta.msg}`;
    this._showNotification(title, message);
  }

  _showNotification(title, message, url) {
    chrome.notifications.create(url, {
      type: "basic",
      title: title,
      iconUrl: chrome.runtime.getURL("txTip.png"),
      message: message
    });
  }

  _subscribeToNotificationClicked() {
    if (!chrome.notifications.onClicked.hasListener(this._viewOnScan)) {
      chrome.notifications.onClicked.addListener(this._viewOnScan);
    }
  }

  //浏览器新tab打开
  _viewOnScan(txId) {
    if (txId.startsWith("https://")) {
      chrome.tabs.create({ url: txId })
    }
  }

  // 获取上一个聚焦的串口的细细
  getLastFocusedWindow() {
    return new Promise((resolve, reject) => {
      chrome.windows.getLastFocused(windowObject => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve(windowObject);
      });
    });
  }

  //聚焦某个窗口
  focusWindow(windowId) {
    return new Promise((resolve, reject) => {
      chrome.windows.update(windowId, { focused: true }, () => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve();
      });
    });
  }

  // 获取所有打开的窗口
  getAllWindows() {
    return new Promise((resolve, reject) => {
      chrome.windows.getAll(windows => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve(windows);
      });
    });
  }
}
export default new ExtensionPlatform();

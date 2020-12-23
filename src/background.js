import ExtensionPlatform from "@/utils/extension";

const WIDTH = 366;
const HEIGHT = 639;
let popUpId = "";
// popup 页面能直接调用此文件内函数
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  // console.log("Hello from the background", request);
  if (request.type === "connect") {
    await ExtensionPlatform.set({
      invokeOrigin: request.url
    });
    const allWindows = await ExtensionPlatform.getAllWindows();
    const existWindow = allWindows.find(win => {
      return win.type === "popup" && win.id === popUpId;
    });
    if (existWindow) {
      ExtensionPlatform.focusWindow(existWindow.id);
    } else {
      const lastFocusWindow = await ExtensionPlatform.getLastFocusedWindow();
      const url = chrome.runtime.getURL("home.html");
      const newWindow = await ExtensionPlatform.openWindow({
        url: url + "#/authorization",
        type: "popup",
        width: WIDTH,
        height: HEIGHT,
        left: lastFocusWindow.left + (lastFocusWindow.width - WIDTH),
        top: lastFocusWindow.top
      });
      popUpId = newWindow.id;
      console.log(newWindow, 888)
    }
  }
  /*browser.tabs.executeScript({
    file: "content-script.js"
  });*/
});


//向content-script发送消息，并监听content的响应
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
  if (port.name === "nabox_wallet_channel") {
    port.onMessage.addListener(function(msg) {
      if (msg.type === "connect") {
        port.postMessage({type: 1, status: true, data: "connect success"});
      } else if (msg.type === "getBalance") {
        port.postMessage({type: 2, status: true, data: "getBalance success"});
      }
    });
  } /* else if (port.name === "auth") {
    port.onMessage.addListener(function(msg) {
      console.log(msg, "===mgs===");
      if (msg.joke == "Knock knock")
        port.postMessage({question: "Who's there?"});
      else if (msg.answer == "Madame")
        port.postMessage({question: "Madame who?"});
      else if (msg.answer == "Madame... Bovary")
        port.postMessage({question: "I don't get it."});
    });
  } */
});

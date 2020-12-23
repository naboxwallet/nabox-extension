/* eslint-disable prettier/prettier */
//直接注入页面的JS,可以获得浏览器所访问的web页面的详细信息，并可以通过操作DOM对页面做出修改,
//可以访问所注入页面的DOM,但是不能访问里面的任何javascript变量和函数
//页面里的javascript也不能访问content script中的任何变量和函数。
import ExtensionPlatform from "@/utils/extension";
console.log("Hello from the content-script", 2333);

/* 
chrome.extension(getURL , inIncognitoContext , lastError , onRequest , sendRequest)
chrome.i18n
chrome.runtime(connect , getManifest , getURL , id , onConnect , onMessage , sendMessage)
chrome.storage
*/

//拿到插件中的数据
/* chrome.storage.local.get(null,function(res){
  console.log(res)
}) */

/*const fs = require('fs');
const path = require("path");
console.log(fs, '===fs', path)
const inpageContent = fs.readFileSync(path.resolve(__dirname, "./dist/js/inPage.js"), "utf8")
const inpageSuffix = '//# sourceURL=' + chrome.runtime.getURL("inpage.js") + "\n";
const inpageBundle = inpageContent + inpageSuffix*/

function NaboxBridge() {
  this.connect = function() {
    console.log("调用连接方法");
  };
}

function injectScript(content) {
  const head = document.head || document.documentElement;
  const script = document.createElement("script");
  script.setAttribute("async", "false");
  // script.textContent = content;
  script.setAttribute("src", content);
  head.insertBefore(script, head.children[0]);
  head.removeChild(script);
}
//content-scripts和原始页面共享DOM，但是不共享JS，如要访问页面JS（例如某个JS变量），只能通过injected js来实现。
// injectScript(NaboxBridge.toString()); //向页面注入js脚本
injectScript(chrome.extension.getURL("js/inPage.js"));
// injectScript(inpageBundle);

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


//监听inpage发来的消息事件
window.addEventListener("message", async function(e){
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
        status: true,
        address: Authorized[0].address
      })
    } else {
      chrome.runtime.sendMessage({
        type: "connect",
        url: targetOrigin
      })
    }
    // console.log(e, "===---===");
    // e.source.postMessage({ method: "answer", "status": true}, e.origin)
    
  } else if (data.method === "getBalance") {
    chrome.runtime.sendMessage({
      type: "getBalance",
    })
  }
}, false);

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

chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (changes.allowSites && changes.allowSites.newValue) {
    // 连接网站修改
    const allowSites = changes.allowSites.newValue;
    const currentSite = allowSites.filter(site => {
      return site.origin = location.origin;
    })[0];
    window.postMessage({
      type: "connect",
      status: true,
      address: currentSite.address,
      network: currentSite.network
    }, location.origin);
  }
})

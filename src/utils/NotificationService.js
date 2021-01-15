import ExtensionPlatform from "./extension";

const WIDTH = 366;
const HEIGHT = 639;
let popUpId = "";

export default class NotificationService {
  static async open(notification) {
    window.notification = notification;
    const allWindows = await ExtensionPlatform.getAllWindows();
    const existWindow = allWindows.find(win => {
      return win.type === "popup" && win.id === popUpId;
    });
    if (existWindow) {
      ExtensionPlatform.focusWindow(existWindow.id);
    } else {
      const lastFocusWindow = await ExtensionPlatform.getLastFocusedWindow();
      const routePath = notification.routePath;
      const url = chrome.runtime.getURL("home.html") + "#" + routePath;
      const newWindow = await ExtensionPlatform.openWindow({
        url,
        type: "popup",
        width: WIDTH,
        height: HEIGHT,
        left: lastFocusWindow.left + (lastFocusWindow.width - WIDTH),
        top: lastFocusWindow.top
      });
      popUpId = newWindow.id;
      chrome.windows.onRemoved.addListener(function(windowId) {
        if (windowId === newWindow.id) {
          notification.responder(false);
          // window.notification = null;
          return false;
        }
      });
    }
  }

  static close() {
    ExtensionPlatform.closeCurrentWindow();
  }
}

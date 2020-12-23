const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin
module.exports = {
  pages: {
    //弹出插件
    popup: {
      template: "public/browser-extension.html",
      entry: "./src/popup/main.js",
      title: "Popup"
    },
    /*options: {
      template: "public/browser-extension.html",
      entry: "./src/options/main.js",
      title: "Options"
    },
    override: {
      template: "public/browser-extension.html",
      entry: "./src/override/main.js",
      title: "Override"
    },
    standalone: {
      template: "public/browser-extension.html",
      entry: "./src/standalone/main.js",
      title: "Standalone",
      filename: "index.html"
    },*/
    devtools: {
      template: "public/browser-extension.html",
      entry: "./src/devtools/main.js",
      title: "Devtools"
    },
    //浏览器
    home: {
      template: "public/browser.html",
      entry: "./src/popup/main.js",
      title: "Nabox Wallet",
      filename: "home.html"
    }
  },
  pluginOptions: {
    //https://github.com/adambullmer/vue-cli-plugin-browser-extension#plugin-options
    //package中的version,description会自动填充到manifest中
    browserExtension: {
      componentOptions: {
        background: {
          entry: "src/background.js"
        },
        contentScripts: {
          entries: {
            "content-script": ["src/content-scripts/content-script.js"]
          }
        }
      },
      //vue-devtools
      manifestTransformer: manifest => {
        if (process.env.NODE_ENV === "development") {
          manifest.content_security_policy = manifest.content_security_policy.replace(
            "script-src",
            "script-src http://localhost:8098"
          );
        }

        return manifest;
      }
    }
  },
  configureWebpack: config => {
    config.plugins.push(
      new CopyPlugin([
        {
          from: path.resolve(__dirname, "./src/inPage.js"),
          to: path.resolve(__dirname, "./dist/js")
        }
      ])
    );
    // config.plugins.push(new BundleAnalyzerPlugin())
  }
};

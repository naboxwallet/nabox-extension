const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

// 生产环境下清除console打印
const plugins = [];
if (process.env.NODE_ENV === 'production') {
  //plugins.push('transform-remove-console');
  plugins.push(["transform-remove-console", { "exclude": [ "error", "warn"] }])
}
module.exports = {
  pages: {
    /* inPage: {
      entry: path.join(__dirname, "./src/inPage.js"),
      chunks: []
    }, */
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
    },
    devtools: {
      template: "public/browser-extension.html",
      entry: "./src/devtools/main.js",
      title: "Devtools"
    },*/
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
  productionSourceMap: false, //关闭sourceMap
  configureWebpack: config => {
    /* config.plugins.push(
      new CopyPlugin([
        {
          from: path.resolve(__dirname, "./src/inPage.js"),
          to: path.resolve(__dirname, "./dist/js")
        }
      ])
    ); */
    // config.plugins.push(new BundleAnalyzerPlugin())
    // config.optimization.minimizer[0] = {}; //无效
  },
  chainWebpack: config => {
    config
      .entry("inPage")
      .add("./src/inPage.js")
      .end() //单独打包inPage
      .output.filename("js/[name].js"); // .libraryTarget("commonjs");
    config.optimization.delete("splitChunks"); //去除代码分割, 否则inPage中的变量不能被web识别
    config.optimization.minimize(false); // 去除代代码压缩
    /* config.when(process.env.NODE_ENV === "production", config => {
      config.
    }); */
  }
  /*parser: 'babel-eslint',//解析器，这里我们使用babel-eslint
  rules:{
    "no-cond-assign": 2, //条件语句的条件中不允许出现赋值运算符
    "no-constant-condition": 2, //条件语句的条件中不允许出现恒定不变的量
  }*/
};

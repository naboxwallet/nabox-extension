import { BigNumber } from "bignumber.js";
import copy from "copy-to-clipboard";
import ExtensionPlatform from "./extension";
import sdk from "nerve-sdk-js/lib/api/sdk";
import { request } from "./request";
var CryptoJS = require("crypto-js");

// 10的N 次方
export function Power(arg) {
  let newPower = new BigNumber(10);
  return newPower.pow(arg);
}

// 加法
export function Plus(nu, arg) {
  let newPlus = new BigNumber(nu);
  return newPlus.plus(arg);
}

// 减法
export function Minus(nu, arg) {
  let newMinus = new BigNumber(nu);
  return newMinus.minus(arg);
}

// 乘法
export function Times(nu, arg) {
  let newTimes = new BigNumber(nu);
  return newTimes.times(arg);
}

// 除法
export function Division(nu, arg) {
  let newDiv = new BigNumber(nu);
  return newDiv.div(arg);
}

// 数字乘以精度系数
export function timesDecimals(nu, decimals) {
  if (decimals === 0) {
    return nu
  }
  return new BigNumber(Times(nu, Power(decimals)))
    .toFormat()
    .replace(/[,]/g, "");
}

/**
 * 数字除以精度系数
 */
export function divisionDecimals(nu, decimals) {
  if (decimals === 0) {
    return nu;
  }
  return new BigNumber(Division(nu, Power(decimals)))
    .toFormat()
    .replace(/[,]/g, "");
}

// 把html转义成HTML实体字符
export function htmlEncode(str) {
  let s = "";
  if (str.length === 0) {
    return "";
  }
  s = str.replace(/&/g, "&amp;");
  s = s.replace(/</g, "&lt;");
  s = s.replace(/>/g, "&gt;");
  s = s.replace(/ /g, "&nbsp;");
  s = s.replace(/\\'/g, "&#39;"); //IE下不支持实体名称
  s = s.replace(/\\"/g, "&quot;");
  return s;
}

export function checkForError() {
  const lastError = chrome.runtime.lastError;
  if (!lastError) {
    return;
  }
  // if it quacks like an Error, its an Error
  if (lastError.stack && lastError.message) {
    return lastError;
  }
  // repair incomplete error object (eg chromium v77)
  return new Error(lastError.message);
}

export function superLong(string, len) {
  if (string && string.length > 10) {
    return (
      string.substr(0, len) +
      "...." +
      string.substr(string.length - len, string.length)
    );
  } else {
    return string;
  }
}
export function copys(val) {
  return copy(val);
}

export function formatTime(time) {
  if (typeof time !== "number") return;
  const t = new Date(time);
  const year = t.getFullYear();
  const month = t.getMonth() + 1;
  const day = t.getDate();
  const hour = t.getHours();
  const minute = t.getMinutes();
  const second = t.getSeconds();
  function addZero(num) {
    return num < 10 ? "0" + num : num;
  }
  return (
    year +
    "-" +
    addZero(month) +
    "-" +
    addZero(day) +
    " " +
    addZero(hour) +
    ":" +
    addZero(minute) +
    ":" +
    addZero(second)
  );
}

export function genID() {
  return (
    Date.now() +
    Number(
      Math.random()
        .toString()
        .split(".")[1]
    )
  ).toString(36);
}

const psKey = CryptoJS.enc.Utf8.parse("naboxChromeExtension");
const iv = CryptoJS.enc.Utf8.parse("1234567812345678");
// AES加密密码
export function encryptPassword(password) {
  const srcs = CryptoJS.enc.Utf8.parse(password);
  const encrypted = CryptoJS.AES.encrypt(srcs, psKey, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.ciphertext.toString().toUpperCase();
}
// AES解密密码
export function decryptPassword(encryptedStr) {
  const encryptedHexStr = CryptoJS.enc.Hex.parse(encryptedStr);
  const srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
  const decrypt = CryptoJS.AES.decrypt(srcs, psKey, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return decrypt.toString(CryptoJS.enc.Utf8);
}

export function getPri(aesPri, password) {
  return sdk.decrypteOfAES(aesPri, password);
}

export async function checkPassword(password) {
  const localPassword = (await ExtensionPlatform.get("password")).password;
  const encryptedPassword = encryptPassword(password);
  if (localPassword !== encryptedPassword) {
    return false;
  }
  return true;
}

export function getOrigin(chain, network) {
  const origins = {
    NULS: {
      beta: "http://beta.nulscan.io",
      main: "https://nulscan.io",
    },
    NERVE: {
      beta: "http://beta.scan.nerve.network",
      main: "https://scan.nerve.network",
    },
    Ethereum: {
      beta: "https://ropsten.etherscan.io",
      main: "https://etherscan.io",
    },
    BSC: {
      beta: "https://testnet.bscscan.com",
      main: "https://bscscan.com",
    },
  }
  return origins[chain][network];
}

export async function getStorage(key, defaultValue) {
  return (await ExtensionPlatform.get(key))[key] || defaultValue;
}

export async function getSelectedAccount() {
  const accountList = await getStorage("accountList", []);
  const currentAccount = accountList.filter(account => account.selection)[0];
  const defaultAccount = currentAccount
    ? { beta: currentAccount.beta, main: currentAccount.main }
    : null;
  return defaultAccount;
}

export async function getSymbolUSD(chain) {
  const res = await request({
    url: "/wallet/main/asset/price",
    data: { chain }
  });
  if (res.code === 1000) {
    return res.data;
  }
  return null;
}

export async function checkBalance(fee) {
  const symbolArr = fee.split("+");
  const symbolToChain = {
    ETH: "Ethereum",
    BNB: "BSC",
    NVT: "NERVE",
    NULS: "NULS"
  }
  let enough = true;
  const accountList = await getStorage("accountList", []);
  const currentAccount = accountList.filter(account => account.selection)[0];
  const network = await getStorage("network");
  const config = JSON.parse(sessionStorage.getItem("config"));
  Object.keys(symbolToChain).map(symbol => {
    symbolArr.map(async fee => {
      if (fee.indexOf(symbol) > -1) {
        const chain = symbolToChain[symbol];
        const address = currentAccount[network][chain];
        const {chainId, assetId} = config[network][chain];
        const balance = await getBalance(chain, address, chainId, assetId)
        if (balance - fee.split(symbol)[0] < 0) {
          enough = false;
        }
      }
    });
  });
  return enough;
}

async function getBalance(chain, address, chainId, assetId) {
  let balance = 0;
  try {
    const res = await request({
      url: "/wallet/address/asset",
      data: { chain, address, chainId, assetId }
    });
    if (res.code === 1000) {
      balance = divisionDecimals(res.data.balance, res.data.decimals);
    }
  } catch (e) {}
  return balance;
}

export async function checkNvtBalance(fee) {
  const accountList = await getStorage("accountList", []);
  const currentAccount = accountList.filter(account => account.selection)[0];
  const network = await getStorage("network");
  const config = JSON.parse(sessionStorage.getItem("config"));
  const address = currentAccount[network].NERVE;
  const {chainId, assetId} = config[network].NERVE;

  const res = await this.$request({
    url: "/wallet/address/asset",
    data: { chain: "NERVE", address, chainId, assetId }
  });
  let balance = 0;
  if (res.code === 1000) {
    balance = divisionDecimals(res.data.balance, res.data.decimals);
  }
  return balance - fee > 0 ? true : false;
}

import {BigNumber} from "bignumber.js";
import copy from "copy-to-clipboard";
import ExtensionPlatform from "./extension";
import sdk from "nerve-sdk-js/lib/api/sdk";
import {request} from "./request";
import store from "./../store";


let CryptoJS = require("crypto-js");

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

/**
 * 保留指定小数位数
 * @param val 要处理的数据，Number | String
 * @param len 保留小数位数，位数不足时，以0填充
 * @param side 1|-1 对应 入|舍
 * @returns {string|number}
 */
export function tofix(val, len, side) {
  const numval = Number(val);
  if (isNaN(numval)) return 0;
  const str = val.toString();
  if (str.indexOf('.') > -1) {
    let numArr = str.split('.');
    if (numArr[1].length > len) {
      let tempnum = numval * Math.pow(10, len);
      if (!side) {
        return Number(val).toFixed(len)
      } else if (side === 1) {
        if (tempnum < 1) return (1 / Math.pow(10, len));
        return (Math.ceil(tempnum) / Math.pow(10, len)).toFixed(len)
      } else if (side === -1) {
        return (Math.floor(tempnum) / Math.pow(10, len)).toFixed(len)
      } else {
        return Number(val.toFixed(len))
      }
    } else {
      return Number(str).toFixed(len)
    }
  } else {
    return Number(val).toFixed(len)
  }
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

//验证密码
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
    Heco: {
      beta: "https://testnet.hecoinfo.com",
      main: "https://scan.hecochain.com",
    },
    OKExChain: {
      beta: "https://www.oklink.com/okexchain-test",
      main: "https://www.oklink.com/okexchain",
    }
  };
  return origins[chain][network];
}

export async function getStorage(key, defaultValue) {
  return (await ExtensionPlatform.get(key))[key] || defaultValue;
}

export async function getSelectedAccount() {
  const accountList = await getStorage("accountList", []);
  const currentAccount = accountList.filter(account => account.selection)[0];
  const defaultAccount = currentAccount
    ? {beta: currentAccount.beta, main: currentAccount.main}
    : null;
  return defaultAccount;
}

export async function getSymbolUSD(chain) {
  const res = await request({
    url: "/asset/main/price",
    data: {chain}
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
    HT: "Heco",
    NVT: "NERVE",
    NULS: "NULS"
  };
  let enough = true;
  const accountList = await getStorage("accountList", []);
  const currentAccount = accountList.filter(account => account.selection)[0];
  const network = await getStorage("network", store.state.network);
  const config = JSON.parse(localStorage.getItem("config"));
  const chains = Object.keys(symbolToChain);
  for (let i = 0; i < chains.length; i++) {
    const symbol = chains[i];
    for (let j = 0; j < symbolArr.length; j++) {
      const fee = symbolArr[j];
      if (fee.indexOf(symbol) > -1) {
        const chain = symbolToChain[symbol];
        const address = currentAccount[network][chain];
        const {chainId, assetId} = config[network][chain];
        const balance = await getBalance(chain, address, chainId, assetId);
        //console.log(balance, '----balance----', fee.split(symbol)[0], chain);
        if (balance - fee.split(symbol)[0] < 0) {
          enough = false;
        }
      }
    }
  }
  return enough;
}

async function getBalance(chain, address, chainId, assetId) {
  //console.log(chain, address, chainId, assetId, "getBalance");
  let balance = 0;
  try {
    const res = await request({url: "/wallet/address/asset", data: {chain, address, chainId, assetId, refresh: true}});
    //console.log(res);
    if (res.code === 1000) {
      balance = divisionDecimals(res.data.balance, res.data.decimals);
    }
  } catch (e) {
    console.log(e)
  }
  return balance;
}

export async function getBalances(chain, address, chainId, assetId) {
  return getBalance(chain, address, chainId, assetId)
}


export const chainToSymbol = {
  NULS: "NULS",
  NERVE: "NVT",
  Ethereum: "ETH",
  BSC: "BNB",
  Heco: "HT",
  OKExChain: "OKT"
};

/**
 * data.network 当前网络 beta/main
 * data.fromChain 来源链
 * data.contractAddress  eth、bnb上token资产合约地址
 * data.assetsChainId
 * data.assetsId
 */
export async function getAssetNerveInfo(data) {
  //console.log(data, 888999)
  let result = null;
  let params = {};
  if (data.contractAddress) {
    const config = JSON.parse(localStorage.getItem("config"));
    const mainAsset = config[data.network][data.fromChain]; //来源链(eth,bnb,heco)主资产信息
    params = {chainId: mainAsset.chainId, contractAddress: data.contractAddress};
  } else {
    params = {chainId: data.assetsChainId, assetId: data.assetsId};
  }
  //console.log(params);
  try {
    const res = await request({url: "/asset/nerve/chain/info", data: params});
    //console.log(res);
    if (res.code === 1000) {
      result = res.data;
    }
  } catch (e) {
    console.error(e);
  }
  return result;
}

/**
 * @disc: 数组去重
 * @params:
 * @date: 2021-03-16 15:38
 * @author: Wave
 */
export function arrDistinctByProp(arr, prop) {
  let obj = {};
  return arr.reduce(function (preValue, item) {
    obj[item[prop]] ? '' : obj[item[prop]] = true && preValue.push(item);
    return preValue
  }, [])
}


// 根据已授权账户，返回当前连接的授权账户
export async function getCurrentAuthAccount(approvedList) {
  const nabox = await getStorage("nabox", {});
  const defaultAccount = await getSelectedAccount();
  const { chain = "Ethereum", chainId = "0x1", network = "main" } = nabox;
  // const approvedList = nabox.
  const defaultAddress = defaultAccount[network][chain];
  const payload = { address: null, chainId }
  const account = approvedList.filter(item => item.address === defaultAddress)[0] || approvedList[0];
  if (account) {
    payload.address = account.address || null
  }
  return payload
}

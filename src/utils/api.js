import nuls from "nuls-sdk-js";
import nerve from "nerve-sdk-js";
import { ethers } from "ethers";
import sdk from "nerve-sdk-js/lib/api/sdk";
import {
  Plus,
  htmlEncode,
  getPri,
  timesDecimals,
  decryptPassword
} from "./util";
import ExtensionPlatform from "./extension";
import { request } from "./request";

export function createAccount(password, pri) {
  if (pri) {
    const { aesPri, pub } = getAesPri_PubByPri(password, pri);
    const beta = getAddress("pri", pri, pub, "beta");
    const main = getAddress("pri", pri, pub, "main");
    return { aesPri, pub, beta, main };
  } else {
    const { pri, aesPri, pub } = getAesPri_PubByPassword(password);
    const beta = getAddress("password", pri, pub, "beta");
    const main = getAddress("pri", pri, pub, "main");
    return { aesPri, pub, beta, main };
  }
}

/**
 * @desc 通过密码创建aesPri,pub
 * @param password 密码
 */
export function getAesPri_PubByPassword(password) {
  const addressInfo = sdk.newEcKey(password);
  const { pri, pub } = addressInfo;
  const aesPri = sdk.encrypteByAES(pri, password);
  return { pri, aesPri, pub };
}

/**
 * @desc 通过pri创建aesPri,pub
 * @param password 密码
 */
export function getAesPri_PubByPri(password, pri) {
  const aesPri = sdk.encrypteByAES(pri, password);
  const pub = sdk.getPub(pri);
  return { aesPri, pub };
}

/**
 * @desc 获取地址
 * @param type： password/pri 创建地址方式
 * @param pri
 * @param pub
 * @param network beta/main
 */
function getAddress(type = "password", pri, pub, network = "beta") {
  let NULS, NERVE, Ethereum, BSC;
  const nPub = type === "password" ? pub : null;
  const config = JSON.parse(sessionStorage.getItem("config"));
  if (!config.beta || !config.main) {
    throw "未获取到链配置，创建账户失败";
  }
  const configInfo = config[network];
  NULS = sdk.getStringAddress(
    configInfo.NULS.chainId,
    pri,
    nPub,
    configInfo.NULS.prefix
  );
  NERVE = sdk.getStringAddress(
    configInfo.NERVE.chainId,
    pri,
    nPub,
    configInfo.NERVE.prefix
  );
  Ethereum = BSC = ethers.utils.computeAddress(
    ethers.utils.hexZeroPad(ethers.utils.hexStripZeros("0x" + pub), 33)
  );
  return {
    NULS,
    NERVE,
    Ethereum,
    BSC
  };
}

export function validateAddress(account) {
  try {
    ethers.utils.getAddress(account);
    return true;
  } catch (error) {
    console.error("地址校验失败: " + error);
  }
  return false;
}

// NULS NERVE跨链手续费
export const crossFee = 0.01;
const nSdk = {
  NERVE: nerve,
  NULS: nuls
};

export class NTransfer {
  constructor(props) {
    if (!props.chain) {
      throw "未获取到交易网络，组装交易失败";
    }
    const validNetwork = ["beta", "main"];
    if (validNetwork.indexOf(props.network) === -1) {
      throw "invalid network";
    }
    this.chain = props.chain; //链网络
    this.network = props.network; //网络 beta or main
    this.type = props.type; //交易类型
    this.sdk = nSdk[this.chain] || nerve; // nerve nuls sdk
  }
  async getTxHex(data) {
    const encryptPassword = (await ExtensionPlatform.get("password")).password;
    const password = decryptPassword(encryptPassword);
    const accountList = (await ExtensionPlatform.get("accountList"))
      .accountList;
    const currentAccount = accountList.filter(v => v.selection)[0];
    const pri = getPri(currentAccount.aesPri, password);
    console.log(pri, "===pri===")
    const { inputs, outputs, txData, remarks = "" } = data;
    // 组装交易
    console.log(inputs, outputs, txData, remarks, 998877, this.type)
    const tAssemble = this.sdk.transactionAssemble(
      inputs,
      outputs,
      htmlEncode(remarks),
      this.type,
      txData
    );
    // 交易签名
    const txHex = this.sdk.transactionSerialize(
      pri,
      currentAccount.pub,
      tAssemble
    );
    return txHex;
  }
  inputsOrOutputs(data) {
    if (!this.type) {
      throw "获取交易类型失败";
    }
    if (this.type === 2) {
      //链内交易
      return this.transferTransaction(data);
    } else if (this.type === 10) {
      //跨链交易
      return this.crossChainTransaction(data);
    } else if (this.type === 16) {
      //调用合约
      if (this.chain !== "NULS") {
        throw "nerve网络不支持合约操作";
      }
      return this.callContractTransaction(data);
    } else if (this.type === 43) {
      // nerve 网络提现到eth bsc
      return this.WithdrawalTransaction(data);
    }
  }
  //nuls nerve普通转账input output
  async transferTransaction(transferInfo) {
    const inputs = [],
      outputs = [];
    //转账资产nonce
    const nonce = await this.getNonce(transferInfo);
    if (!nonce) throw "获取nonce值失败";
    const config = JSON.parse(sessionStorage.getItem("config"));
    const mainAsset = config[this.network][this.chain];
    if (
      mainAsset.chainId === transferInfo.assetsChainId &&
      mainAsset.assetId === transferInfo.assetsId
    ) {
      // 转账资产为本链主资产, 将手续费和转账金额合成一个input
      const newAmount = Plus(transferInfo.amount, transferInfo.fee).toFixed();
      inputs.push({
        address: transferInfo.from,
        assetsChainId: transferInfo.assetsChainId,
        assetsId: transferInfo.assetsId,
        amount: newAmount,
        locked: 0,
        nonce: nonce
      });
    } else {
      const mainAssetNonce = await this.getNonce({
        from: transferInfo.from,
        assetsChainId: mainAsset.chainId,
        assetsId: mainAsset.assetId
      });
      inputs.push({
        address: transferInfo.from,
        assetsChainId: transferInfo.assetsChainId,
        assetsId: transferInfo.assetsId,
        amount: transferInfo.amount,
        locked: 0,
        nonce: nonce
      });
      inputs.push({
        address: transferInfo.from,
        assetsChainId: mainAsset.chainId,
        assetsId: mainAsset.assetId,
        amount: transferInfo.fee,
        locked: 0,
        nonce: mainAssetNonce
      });
    }
    outputs.push({
      address: transferInfo.to,
      assetsChainId: transferInfo.assetsChainId,
      assetsId: transferInfo.assetsId,
      amount: transferInfo.amount,
      lockTime: 0
    });
    return { inputs, outputs };
  }
  // nuls nerve跨链转账input output
  async crossChainTransaction(transferInfo) {
    const { inputs, outputs } = await this.transferTransaction(transferInfo);
    const CROSS_INFO = JSON.parse(sessionStorage.getItem("config"))[this.network]["NULS"];
    if (this.chain === "NERVE") {
      // nerve资产跨链到nuls,要收取nuls手续费
      let isNULS = false;
      const fee = timesDecimals(crossFee, 8);
      for (let input of inputs) {
        if (input.assetsChainId === CROSS_INFO.chainId &&input.assetsId === CROSS_INFO.assetId) {
          //跨链资产为nuls
          isNULS = true;
          input.amount = Plus(input.amount, fee).toFixed();
        }
      }
      if (!isNULS) {
        // 跨链资产不是nuls
        // const balanceInfo = await getBaseAssetInfo(CROSS_INFO.chainId, CROSS_INFO.assetId, this.from);
        const nonce = await this.getNonce({
          from: transferInfo.from,
          assetsChainId: CROSS_INFO.chainId,
          assetsId: CROSS_INFO.assetId
        });
        inputs.push({
          address: transferInfo.from,
          assetsChainId: CROSS_INFO.chainId,
          assetsId: CROSS_INFO.assetId,
          amount: fee,
          locked: 0,
          nonce: nonce
        });
      }
    }
    return { inputs, outputs };
  }
  // 调用合约交易
  async callContractTransaction(transferInfo) {
    // const balanceInfo = await getBaseAssetInfo(CROSS_INFO.chainId, CROSS_INFO.assetId, this.from);
    const nonce = await this.getNonce(transferInfo);
    const defaultFee = timesDecimals(0.001, 8);
    const inputs = [
      {
        address: transferInfo.from,
        assetsChainId: transferInfo.assetsChainId,
        assetsId: transferInfo.assetsId,
        amount: Plus(transferInfo.amount, defaultFee).toFixed(),
        locked: 0,
        nonce: nonce
      }
    ];
    const outputs = [];
    if (transferInfo.toContractValue) {
      outputs.push({
        address: transferInfo.to,
        assetsChainId: transferInfo.assetsChainId,
        assetsId: transferInfo.assetsId,
        amount: transferInfo.toContractValue,
        lockTime: 0
      });
    }
    return { inputs, outputs };
  }
  // nerve 提现
  async WithdrawalTransaction(transferInfo) {
    console.log(transferInfo, 8888)
    const config = JSON.parse(sessionStorage.getItem("config"));
    const mainAsset = config[this.network][this.chain];
    const nonce = await this.getNonce(transferInfo);
    const mainAssetNonce = await this.getNonce({
      from: transferInfo.from,
      assetsChainId: mainAsset.chainId,
      assetsId: mainAsset.assetId
    });
    let inputs = [];
    const totalFee = Number(Plus(transferInfo.proposalPrice, transferInfo.fee));
    if (
      mainAsset.chainId === transferInfo.assetsChainId &&
      mainAsset.assetId === transferInfo.assetsId
    ) {
      const newAmount = Number(Plus(transferInfo.amount, totalFee));
      inputs.push({
        address: transferInfo.from,
        amount: newAmount,
        assetsChainId: transferInfo.assetsChainId,
        assetsId: transferInfo.assetsId,
        nonce: nonce,
        locked: 0
      });
    } else {
      inputs = [
        {
          address: transferInfo.from,
          amount: transferInfo.amount,
          assetsChainId: transferInfo.assetsChainId,
          assetsId: transferInfo.assetsId,
          nonce: nonce,
          locked: 0
        },
        {
          address: transferInfo.from,
          amount: totalFee,
          assetsChainId: mainAsset.chainId,
          assetsId: mainAsset.assetId,
          nonce: mainAssetNonce,
          locked: 0
        }
      ];
    }
    // 系统补贴手续费地址
    const feeAddress = mainAsset.config.feeAddress;
    const blockHoleAddress = mainAsset.config.destroyAddress;
    let outputs = [
      {
        address: blockHoleAddress, //黑洞地址
        amount: transferInfo.amount,
        assetsChainId: transferInfo.assetsChainId,
        assetsId: transferInfo.assetsId,
        locked: 0
      },
      {
        address: feeAddress, //提现费用地址
        amount: transferInfo.proposalPrice,
        assetsChainId: mainAsset.chainId,
        assetsId: mainAsset.assetId,
        locked: 0
      }
    ];
    return { inputs, outputs };
  }
  async getNonce(info) {
    try {
      const res = await request({
        url: "/wallet/address/asset",
        data: {
          chain: this.chain,
          address: info.from,
          chainId: info.assetsChainId,
          assetId: info.assetsId
        }
      });
      if (res.code === 1000) {
        return res.data.nonce;
      }
      return null;
    } catch (e) {
      console.error(e);
    }
  }
}

const BNB_RPC_URL = {
  ropsten: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  homestead: "https://bsc-dataseed.binance.org/"
};

const CROSS_OUT_ABI = [
  "function crossOut(string to, uint256 amount, address ERC20) public payable returns (bool)"
];
const ERC20_ABI = [
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)"
];

export class ETransfer {
  constructor(props) {
    console.log(props, 44)
    if (!props.chain) {
      throw "未获取到网络，组装交易失败";
    }
    const validChains = ["Ethereum", "BSC"];
    const validNetwork = ["beta", "main"];
    if (validChains.indexOf(props.chain) === -1) {
      throw "invalid chain";
    }
    if (validNetwork.indexOf(props.network) === -1) {
      throw "invalid network";
    }
    this.chain = props.chain; //链网络
    this.network = props.network; //网络 beta or main
    this.provider = this.getProvider(this.chain, this.network);
  }
  getProvider(chain, network) {
    const ETHNET = network === "main" ? "homestead" : "ropsten";
    if (chain === "Ethereum") {
      return ethers.getDefaultProvider(ETHNET);
    } else {
      return new ethers.providers.JsonRpcProvider(BNB_RPC_URL[ETHNET]);
    }
  }

  async sendTransaction(params) {
    const wallet = await this.getWallet();
    const nonce = await wallet.getTransactionCount();
    if (params.contractAddress) {
      // token转账
      const erc20TransferAbiFragment = [{
          name: "transfer",
          type: "function",
          inputs: [{"name": "_to", "type": "address"}, {"type": "uint256", "name": "_tokens"}],
          constant: false,
          outputs: [],
          payable: false
      }];
      const contract = new ethers.Contract(params.contractAddress, erc20TransferAbiFragment, wallet);
      const numberOfTokens = ethers.utils.parseUnits(
        params.value,
        params.tokenDecimals
      );
      const transaction = {
        nonce: nonce
      };
      if (params.upSpeed) {
        transaction.gasPrice = await this.getSpeedUpGasPrice();
      }
      return await contract.transfer(params.to, numberOfTokens, transaction);
    } else {
      // 非token转账
      const value = ethers.utils.parseEther(params.value);
      const transaction = {
        nonce,
        to: params.to,
        value
      };
      if (params.upSpeed) {
        transaction.gasPrice = await this.getSpeedUpGasPrice();
      }
      return await wallet.sendTransaction(transaction);
    }
  }

  async getWallet() {
    const encryptPassword = (await ExtensionPlatform.get("password")).password;
    const password = decryptPassword(encryptPassword);
    const accountList = (await ExtensionPlatform.get("accountList"))
      .accountList;
    const currentAccount = accountList.filter(v => v.selection)[0];
    const pri = getPri(currentAccount.aesPri, password);
    const privateKey = ethers.utils.hexZeroPad(
      ethers.utils.hexStripZeros("0x" + pri),
      32
    );
    return new ethers.Wallet(privateKey, this.provider);
  }

  async sendTransactionByTxHex(params) {
    const txHex = await this.getTxHex(params);
    const tx = await this.provider.sendTransaction(txHex);
    console.log(tx, 99966)
    return tx;
  }
  /**
   * 交易签名 不会自动填充gaslimit、gasprice等值
   * to 交易地址
   * value 转账金额
   * upSpeed 是否加速
   * contractAddress token交易时合约地址
   * tokenDecimals token decimals
   */
  async getTxHex(params) {
    const wallet = await this.getWallet();
    const nonce = await wallet.getTransactionCount();
    const gasPrice = await this.provider.getGasPrice();
    const gasLimit = params.contractAddress ? "100000" : "33594";
    const transaction = {
      nonce,
      gasLimit: Number(gasLimit),
      gasPrice
    };
    if (params.contractAddress) {
      // token转账
      const numberOfTokens = ethers.utils.parseUnits(
        params.value,
        params.tokenDecimals
      );
      const iface = new ethers.utils.Interface([
        "function transfer(address recipient, uint256 amount)"
      ]);
      const data = iface.functions["transfer(address,uint256)"].encode([
        params.to,
        numberOfTokens
      ]);
      transaction.to = params.contractAddress;
      transaction.data = data;
      if (params.upSpeed) {
        transaction.gasPrice = await this.getSpeedUpGasPrice();
      }
      return wallet.sign(transaction);
    } else {
      // 非token转账
      const value = ethers.utils.parseEther(params.value);
      /* const transaction = {
        nonce,
        to: params.to,
        value,
        gasLimit: 21000,
        // gasPrice: ethers.utils.bigNumberify("20000000000")
      }; */
      transaction.to = params.to;
      transaction.value = value;

      if (params.upSpeed) {
        transaction.gasPrice = await this.getSpeedUpGasPrice();
      }
      console.log(transaction, 888)
      return await wallet.sign(transaction);
    }
  }

  /**
   * 跨链转入交易签名
   * to nerve地址
   * value 转账金额
   * upSpeed 是否加速
   * multySignAddress 多签地址
   * contractAddress token交易时合约地址
   * tokenDecimals token decimals
   */
  async getCrossInTxHex(params) {
    const wallet = await this.getWallet();
    const nonce = await wallet.getTransactionCount();
    const gasPrice = await this.provider.getGasPrice();
    const gasLimit = params.contractAddress ? "100000" : "33594";
    const transaction = {
      to: params.multySignAddress,
      nonce,
      gasLimit: Number(gasLimit),
      gasPrice
    };
    const iface = new ethers.utils.Interface(CROSS_OUT_ABI);
    if (params.contractAddress) {
      // token转账
      const numberOfTokens = ethers.utils.parseUnits(
        params.value,
        params.tokenDecimals
      );
      const data = iface.functions.crossOut.encode([ params.to, numberOfTokens, params.contractAddress ]);
      transaction.from = params.from;
      transaction.value = "0x00";
      transaction.data = data;
      if (params.upSpeed) {
        transaction.gasPrice = await this.getSpeedUpGasPrice();
      }
      const failed = await this.validate(transaction);
      if (failed) {
        console.error("failed: " + failed);
        return null;
      }
      delete transaction.from; //etherjs 4.0 from参数无效 报错
      return wallet.sign(transaction);
    } else {
      // 非token转账
      const value = ethers.utils.parseEther(params.value);
      const data = iface.functions.crossOut.encode([ params.to, value, "0x0000000000000000000000000000000000000000" ]);

      transaction.value = value;
      transaction.data = data;

      if (params.upSpeed) {
        transaction.gasPrice = await this.getSpeedUpGasPrice();
      }
      const failed = await this.validate(transaction);
      if (failed) {
        console.error("failed: " + failed);
        return null;
      }
      console.log(transaction, 888)
      return await wallet.sign(transaction);
    }
  }
  // 获取手续费
  getGasPrice(gasLimit) {
    return this.provider.getGasPrice().then(gasPrice => {
      return ethers.utils
        .formatEther(gasPrice.mul(gasLimit).toString())
        .toString();
    });
  }
  // 加速手续费
  async getSpeedUpFee(gasLimit) {
    const gasPrice = await this.getSpeedUpGasPrice();
    return ethers.utils
      .formatEther(gasPrice.mul(gasLimit).toString())
      .toString();
  }
  // 加速gasprice
  getSpeedUpGasPrice() {
    const GWEI_10 = ethers.utils.parseUnits("10", 9);
    return this.provider.getGasPrice().then(gasPrice => {
      return gasPrice.add(GWEI_10);
    });
  }
  //验证交易参数
  async validate(tx) {
    try {
      const result = await this.provider.call(tx);
      return ethers.utils.toUtf8String("0x" + result.substr(138));
    } catch (e) {
      return false;
    }
  }
  /**
   * 提现默认手续费--nvt
   * @param nvtUSD    nvt的USDT价格
   * @param heterogeneousChainUSD    异构链币种的USDT价格
   * @param isToken   是否token资产
   */
  async calWithdrawalNVTFee(nvtUSD, heterogeneousChainUSD, isToken) {
    const gasPrice = await this.getWithdrawGas();
    let gasLimit;
    if (isToken) {
      gasLimit = new ethers.utils.BigNumber("210000");
    } else {
      gasLimit = new ethers.utils.BigNumber("190000");
    }
    const nvtUSDBig = ethers.utils.parseUnits(nvtUSD, 6);
    const ethUSDBig = ethers.utils.parseUnits(heterogeneousChainUSD, 6);
    const result = ethUSDBig.mul(gasPrice).mul(gasLimit).div(ethers.utils.parseUnits(nvtUSDBig.toString(), 10));
    // console.log('result: ' + result.toString());
    const numberStr = ethers.utils.formatUnits(result, 8).toString();
    const ceil = Math.ceil(numberStr);
    // console.log('ceil: ' + ceil);
    const finalResult = ethers.utils.parseUnits(ceil.toString(), 8);
    // console.log('finalResult: ' + finalResult);
    return finalResult;
  }
  // 提现gas
  getWithdrawGas() {
    return this.provider.getGasPrice().then(gasPrice => {
      return gasPrice;
    });
  }
  /**
   * 计算提现手续费  eth/bnb
   */
  async calWithdrawFee(isToken) {
    const gasPrice = await this.getWithdrawGas();
    let gasLimit;
    if (isToken) {
      gasLimit = new ethers.utils.BigNumber("210000");
    } else {
      gasLimit = new ethers.utils.BigNumber("190000");
    }
    const result = gasLimit.mul(gasPrice);
    const finalResult = ethers.utils.formatEther(result);
    // console.log('finalResult: ' + finalResult);
    return finalResult.toString();
  }
  /**
   * 通过自定义的eth/bnb数量 计算出相应的nvt数量
   * @param nvtUSD                            nvt的USDT价格
   * @param number                           异构链币种数量
   * @param heterogeneousChainUSD      异构链币种的USDT价格
   */
  calNvtByEth(nvtUSD, number, heterogeneousChainUSD) {
    let ethAmount = ethers.utils.parseEther(number);
    // console.log('ethAmount: ' + ethAmount.toString());
    let nvtUSDBig = ethers.utils.parseUnits(nvtUSD, 6);
    let ethUSDBig = ethers.utils.parseUnits(heterogeneousChainUSD, 6);
    let result = ethAmount.mul(ethUSDBig).div(ethers.utils.parseUnits(nvtUSDBig.toString(), 10));
    // console.log('result: ' + result.toString());
    // console.log('result format: ' + ethers.utils.formatUnits(result, 8));
    let numberStr = ethers.utils.formatUnits(result, 8).toString();
    let ceil = Math.ceil(numberStr);
    // console.log('ceil: ' + ceil);
    let finalResult = ethers.utils.parseUnits(ceil.toString(), 8);
    // console.log('finalResult: ' + finalResult);
    return finalResult.toString();
  }
}

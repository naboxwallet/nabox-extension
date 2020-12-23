import nuls from "nuls-sdk-js";
import nerve from "nerve-sdk-js";
import { ethers } from "ethers";
import sdk from "nerve-sdk-js/lib/api/sdk";
import { Plus, htmlEncode, getPri, timesDecimals, decryptPassword } from "./util";
import ExtensionPlatform from "./extension";
import { request } from "./request";

const nSdk = {
  NERVE: nerve,
  NULS: nuls
};

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

// NULS NERVE跨链手续费
export const crossFee = 0.3;

export class NTransfer {
  constructor(props) {
    this.chain = props.chain; //链网络
    if (!props.chain) {
      throw "未获取到交易网络，组装交易失败";
    }
    this.sdk = nSdk[props.chain] || nerve; // nerve nuls sdk
    this.network = props.network || "main"; //网络 beta or main
    this.type = props.type; //交易类型
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
      })
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
  crossChainTransaction(transferInfo) {
    const { inputs, outputs } = this.transferTransaction();
    // const CROSS_INFO = JSON.parse(sessionStorage.getItem("config"))[this.network]["NULS"];
    const CROSS_INFO = {};
    if (this.chain === "NERVE") {
      // nerve资产跨链到nuls,要收取nuls手续费
      let isNULS = false;
      const fee = timesDecimals(crossFee, 8);
      for (let input of inputs) {
        if (input.assetsChainId === CROSS_INFO.chainId &&input.assetsId === CROSS_INFO.assetsId) {
          //跨链资产为nuls
          isNULS = true;
          input.amount = Plus(input.amount, fee).toFixed();
        }
      }
      if (!isNULS) {
        // 跨链资产不是nuls
        // const balanceInfo = await getBaseAssetInfo(CROSS_INFO.chainId, CROSS_INFO.assetId, this.from);
        const nonce = ""; // nuls nonce值
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
      console.log(res, 88998899)
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
export class ETransfer {
  constructor(props) {
    if (!props.chain || !props.network) {
      throw "未获取到网络，组装交易失败";
    }
    this.chain = props.chain;
    this.network = props.network;
    // this.gasLimit = this.isToken ? "100000" : "33594";
    this.provider = this.getProvider(props.chain, props.network);
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
  calWithdrawalFee() {

  }
}

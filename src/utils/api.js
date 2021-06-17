import nuls from "nuls-sdk-js";
import nerve from "nerve-sdk-js";
import {ethers} from "ethers";
import sdk from "nerve-sdk-js/lib/api/sdk";
import {Plus, htmlEncode, getPri, timesDecimals, decryptPassword, Minus} from "./util";
import ExtensionPlatform from "./extension";
import {request} from "./request";

export function createAccount(password, pri) {
  if (pri) {
    const {aesPri, pub} = getAesPri_PubByPri(password, pri);
    const beta = getAddress("pri", pri, pub, "beta");
    const main = getAddress("pri", pri, pub, "main");
    return {aesPri, pub, beta, main};
  } else {
    const {pri, aesPri, pub} = getAesPri_PubByPassword(password);
    const beta = getAddress("password", pri, pub, "beta");
    const main = getAddress("pri", pri, pub, "main");
    return {aesPri, pub, beta, main};
  }
}

/**
 * @desc 通过密码创建aesPri,pub
 * @param password 密码
 */
export function getAesPri_PubByPassword(password) {
  const addressInfo = sdk.newEcKey(password);
  const {pri, pub} = addressInfo;
  const aesPri = sdk.encrypteByAES(pri, password);
  return {pri, aesPri, pub};
}

/**
 * @desc 通过pri创建aesPri,pub
 * @param password 密码
 * @param pri 密码
 */
export function getAesPri_PubByPri(password, pri) {
  const aesPri = sdk.encrypteByAES(pri, password);
  const pub = sdk.getPub(pri);
  return {aesPri, pub};
}

/**
 * @desc 获取地址
 * @param type： password/pri 创建地址方式
 * @param pri
 * @param pub
 * @param network beta/main
 */
function getAddress(type = "password", pri, pub, network = "beta") {
  let NULS, NERVE, Ethereum;
  const nPub = type === "password" ? pub : null;
  const config = JSON.parse(localStorage.getItem("config"));
  if (!config.beta || !config.main) {
    throw "未获取到链配置，创建账户失败";
  }
  const configInfo = config[network];
  console.log(configInfo, "configInfo");
  NULS = sdk.getStringAddress(configInfo.NULS.chainId, pri, nPub, configInfo.NULS.prefix);
  NERVE = sdk.getStringAddress(configInfo.NERVE.chainId, pri, nPub, configInfo.NERVE.prefix);
  Ethereum = ethers.utils.computeAddress(ethers.utils.hexZeroPad(ethers.utils.hexStripZeros("0x" + pub), 33));
  return {NULS, NERVE, Ethereum, BSC: Ethereum, Heco: Ethereum, OKExChain: Ethereum};
}

//验证地址
export function validateAddress(account) {
  try {
    ethers.utils.getAddress(account);
    return true;
  } catch (error) {
    console.info(error);
  }
  return false;
}

// NULS NERVE跨链手续费
export const crossFee = 0.01;
const nSdk = {NERVE: nerve, NULS: nuls};

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

  async getTxHex(data, priHex, pubKey) {
    let pri, pub;
    if (priHex) {
      pri = priHex
      pub = pubKey
    } else {
      const encryptPassword = (await ExtensionPlatform.get("password")).password;
      const password = decryptPassword(encryptPassword);
      const accountList = (await ExtensionPlatform.get("accountList")).accountList;
      const currentAccount = accountList.filter(v => v.selection)[0];
      pri = getPri(currentAccount.aesPri, password);
      pub = currentAccount.pub
    }
    //console.log(pri, "===pri===");
    const {inputs, outputs, txData, remarks = ""} = data;
    // 组装交易
    //console.log(inputs, outputs);
    const tAssemble = this.sdk.transactionAssemble(inputs, outputs, htmlEncode(remarks), this.type, txData);
    //console.log(tAssemble,"------------" ,tAssemble.txSerialize().toString('hex'), "tAssemble");
    // 交易签名
    const txHex = this.sdk.transactionSerialize(pri, pub, tAssemble);
    return txHex;
  }

  async inputsOrOutputs(data) {
    //console.log(this.type, data);
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
      /* const assetNerveInfo = await this.getAssetNerveInfo(data);
      if (assetNerveInfo) {
        data.assetsChainId = assetNerveInfo.chainId;
        data.assetsId = assetNerveInfo.assetId;
        return this.WithdrawalTransaction(data);
      } else {
        throw "获取该资产在nerve链上信息失败";
      } */
    }
  }

  //nuls nerve普通转账input output
  async transferTransaction(transferInfo) {
    const inputs = [], outputs = [];
    //转账资产nonce
    const nonce = await this.getNonce(transferInfo);
    if (!nonce) throw "获取nonce值失败";
    const config = JSON.parse(localStorage.getItem("config"));
    const mainAsset = config[this.network][this.chain];
    if (mainAsset.chainId === transferInfo.assetsChainId && mainAsset.assetId === transferInfo.assetsId) {
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
    return {inputs, outputs};
  }

  // nuls nerve跨链转账input output
  async crossChainTransaction(transferInfo) {
    const {inputs, outputs} = await this.transferTransaction(transferInfo);
    const CROSS_INFO = JSON.parse(localStorage.getItem("config"))[this.network]["NULS"];
    if (this.chain === "NERVE") {
      // nerve资产跨链到nuls,要收取nuls手续费
      let isNULS = false;
      const fee = timesDecimals(crossFee, 8);
      for (let input of inputs) {
        if (input.assetsChainId === CROSS_INFO.chainId && input.assetsId === CROSS_INFO.assetId) {
          //跨链资产为nuls
          isNULS = true;
          input.amount = Plus(input.amount, fee).toFixed();
        }
      }
      if (!isNULS) {
        // 跨链资产不是nuls
        const nonce = await this.getNonce({
          from: transferInfo.from,
          assetsChainId: CROSS_INFO.chainId,
          assetsId: CROSS_INFO.assetId
        });
        //console.log(nonce,"*************");

        if (!nonce) {
          return {
            success: false,
            data: {from: transferInfo.from, assetsChainId: CROSS_INFO.chainId, assetsId: CROSS_INFO.assetId}
          };
        }
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
    return {inputs, outputs};
  }

  // 调用合约交易
  async callContractTransaction(transferInfo) {
    //console.log("callContractTransaction:");
    //console.log(transferInfo);
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
    return {inputs, outputs};
  }

  // nerve 提现
  async WithdrawalTransaction(transferInfo) {
    //console.log(transferInfo, 8888);
    const config = JSON.parse(localStorage.getItem("config"));
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
    return {inputs, outputs};
  }

  async getNonce(info) {
    //console.log(info,"getNonce");
    try {
      let data = {
        chain: this.chain,
        address: info.from,
        chainId: info.assetsChainId,
        assetId: info.assetsId,
        refresh: true
      };
      //console.log(data);
      const res = await request({url: "/wallet/address/asset", data: data});
      //console.log(res);
      if (res.code === 1000) {
        return res.data.nonce;
      }
      return null;
    } catch (e) {
      console.error(e);
    }
  }

  async getAssetNerveInfo(data) {
    //console.log(data, 888999)
    let result = null;
    let params = {};
    if (data.contractAddress) {
      const config = JSON.parse(localStorage.getItem("config"));
      const mainAsset = config[this.network][data.fromChain]; //来源链(eth,bnb,heco)主资产信息
      params = {chainId: mainAsset.chainId, contractAddress: data.contractAddress};
    } else {
      params = {chainId: data.assetsChainId, assetId: data.assetsId};
    }
    try {
      const res = await request({url: "/asset/nerve/chain/info", data: params});
      if (res.code === 1000) {
        result = res.data;
      }
    } catch (e) {
      console.error(e);
    }
    return result;
  }

  //交易签名
  async transactionAssemble(data, priHex, pubKey) {
    let pri, pub
    if (priHex) {
      pri = priHex
      pub = pubKey
    } else {
      const encryptPassword = (await ExtensionPlatform.get("password")).password;
      const password = decryptPassword(encryptPassword);
      const accountList = (await ExtensionPlatform.get("accountList")).accountList;
      //console.log(data,accountList);
      let currentAccount = {};
      if (data.id) {
        currentAccount = accountList.filter(v => v.id === data.id)[0];
      } else {
        currentAccount = accountList.filter(v => v.selection)[0];
      }
      //console.log(currentAccount);
      pri = getPri(currentAccount.aesPri, password);
      pub = currentAccount.pub
    }
    
    const {inputs, outputs, txData, remarks = ""} = data;
    // 组装交易
    const tAssemble = this.sdk.transactionAssemble(inputs, outputs, htmlEncode(remarks), this.type, txData);
    // 交易签名
    const txHex = this.sdk.transactionSerialize(pri, pub, tAssemble);
    return txHex;
  }

  /**
   * @desc 签名message
   * @param {string} dataHex // 签名内容
   * @param {string} pri
   */
  async signMessage(dataHex, priHex) {
    function dataToHex(data) {
      try {
          let _data = Buffer.from(data, "hex").toString("hex");
          let isHex = _data != '' && _data === data;
          if (isHex) {
              return data;
          }
          return Buffer.from(data, "utf8").toString("hex");
      } catch (e) {
          return Buffer.from(data, "utf8").toString("hex");
      }
    }
    dataHex = dataToHex(dataHex)
    return sdk.signature(dataHex, priHex)
  }
}

const RPC_URL = {
  BSC: {
    ropsten: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    homestead: "https://bsc-dataseed.binance.org/"
  },
  Heco: {
    ropsten: "https://http-testnet.hecochain.com",
    homestead: "https://http-mainnet.hecochain.com"
  },
  OKExChain: {
    ropsten: "https://exchaintestrpc.okex.org",
    homestead: "https://exchainrpc.okex.org"
  }
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
    if (!props.chain) {
      throw "未获取到网络，组装交易失败";
    }
    const validChains = ["Ethereum", "BSC", "Heco", "OKExChain"];
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
      return new ethers.providers.JsonRpcProvider(RPC_URL[chain][ETHNET]);
    }
  }

  decodeData(data, fromNerve) {
    const commonTransferABI = ["function transfer(address recipient, uint256 amount)"] // eth等链发起的交易
    // CROSS_OUT_ABI nerve链发起的跨链转入交易
    const ABI = fromNerve ? CROSS_OUT_ABI : commonTransferABI
    // const iface = new ethers.utils.Interface(["function transfer(address recipient, uint256 amount)"]); 
    const iface = new ethers.utils.Interface(ABI); 
    console.log(iface, 999, data)
    const txInfo = iface.parseTransaction({data});
    //const decode = iface.functions["transfer(address,uint256)"].decode(data);
    // const decode = iface.decodeFunctionData("transfer(address,uint)", data);
    console.log(txInfo, 444)
    if (txInfo) {
      const amount = txInfo.args[1].toString();
      const to = fromNerve ? txInfo.args[2] : txInfo.args[0]
      if (to === "0x0000000000000000000000000000000000000000") return null; // nerve发起的跨链转入异构链主资产
      return { to, amount }
    }
    return null
  }

  formatEther(value) {
    //console.log(ethers.utils.parseEther('1'), 45);
    return ethers.utils.formatEther(value);
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
      const numberOfTokens = ethers.utils.parseUnits(params.value, params.tokenDecimals);
      const transaction = {nonce: nonce};
      if (params.upSpeed) {
        transaction.gasPrice = await this.getSpeedUpGasPrice();
      }
      return await contract.transfer(params.to, numberOfTokens, transaction);
    } else {
      // 非token转账
      const value = ethers.utils.parseEther(params.value);
      const transaction = {nonce, to: params.to, value};
      if (params.upSpeed) {
        transaction.gasPrice = await this.getSpeedUpGasPrice();
      }
      return await wallet.sendTransaction(transaction);
    }
  }

  
  /**
   * 获取wallet
   */
  async getWallet(priHex) {
    let pri;
    if (priHex) {
      pri = priHex
    } else {
      const encryptPassword = (await ExtensionPlatform.get("password")).password;
      const password = decryptPassword(encryptPassword);
      const accountList = (await ExtensionPlatform.get("accountList")).accountList;
      const currentAccount = accountList.filter(v => v.selection)[0];
      pri = getPri(currentAccount.aesPri, password);
    }
    const privateKey = ethers.utils.hexZeroPad(ethers.utils.hexStripZeros("0x" + pri), 32);
    return new ethers.Wallet(privateKey, this.provider);
  }

  async sendTransactionByTxHex(params) {
    const txHex = await this.getTxHex(params);
    const tx = await this.provider.sendTransaction(txHex);
    //console.log(tx, 99966);
    return tx;
  }

  /**
   * 链内交易签名 不会自动填充gaslimit、gasprice等值
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
    const gasLimit = params.contractAddress ? "100000" : "35000";
    const transaction = {nonce, gasLimit: Number(gasLimit), gasPrice};
    // debugger
    if (params.contractAddress) {
      // token转账
      const numberOfTokens = ethers.utils.parseUnits(params.value, params.tokenDecimals);
      const iface = new ethers.utils.Interface(["function transfer(address recipient, uint256 amount)"]);
      const data = iface.functions["transfer(address,uint256)"].encode([params.to, numberOfTokens]);
      transaction.to = params.contractAddress;
      transaction.data = data;
      if (params.upSpeed) {
        transaction.gasPrice = await this.getSpeedUpGasPrice();
      }
      return wallet.sign(transaction);
    } else {
      console.log(params, 11111);
      // 非token转账
      const value = ethers.utils.parseEther(params.value);
      console.log(value, 22222);
      transaction.to = params.to;
      transaction.value = value;

      if (params.upSpeed) {
        transaction.gasPrice = await this.getSpeedUpGasPrice();
      }
      console.log(transaction, 888);
      return await wallet.sign(transaction);
    }
  }

  /**
   * 链内交易签名 gaslimit、gasprice
   * to 交易地址
   * value 转账金额
   * gaslimit
   * gasprice
   * contractAddress token交易时合约地址
   * tokenDecimals token decimals
   */
  async getTxHexTwo(params) {
    //console.log(params);
    const wallet = await this.getWallet();
    const nonce = await wallet.getTransactionCount();
    const gasPrice = Number(params.gasPrice);
    const gasLimit = Number(params.gasLimit);
    const transaction = {nonce, gasLimit: Number(gasLimit), gasPrice};
    if (params.contractAddress) {
      // token转账
      const numberOfTokens = ethers.utils.parseUnits(params.value, params.tokenDecimals);
      const iface = new ethers.utils.Interface(["function transfer(address recipient, uint256 amount)"]);
      const data = iface.functions["transfer(address,uint256)"].encode([params.to, numberOfTokens]);
      transaction.to = params.contractAddress;
      transaction.data = data;
      // console.log(transaction, 1)
      // return
      return wallet.sign(transaction);
    } else {
      // 非token转账
      const value = ethers.utils.parseEther(params.value);
      transaction.to = params.to;
      transaction.value = value;
      //console.log(transaction, 6666);
      // console.log(transaction, 2)
      // return
      return await wallet.sign(transaction);
    }
  }

  /**
   * ETH data签名
   * tokenDecimals token decimals
   */
  async getTxHexThree(params, priHex) {
    const wallet = await this.getWallet(priHex);
    const nonce = await wallet.getTransactionCount();
    const transaction = { nonce, ...params }
    if (!params.gasLimit&&!params.gasPrice) {
      const gasPrice = await this.provider.getGasPrice();
      const gasLimit = Number(params.value) === 0 && Number(params.data) !== 0 ? "100000" : "35000";
      // transaction = {nonce, gasLimit: Number(gasLimit), gasPrice, ...params};
      transaction.gasLimit = Number(gasLimit)
      transaction.gasPrice = gasPrice
    }
    // delete transaction.from;
    console.log(transaction, "tasn")
    return await wallet.sign(transaction);
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
    const gasLimit = params.contractAddress ? "100000" : "35000";
    const transaction = {to: params.multySignAddress, nonce, gasLimit: Number(gasLimit), gasPrice};
    const iface = new ethers.utils.Interface(CROSS_OUT_ABI);
    if (params.contractAddress) {
      // token转账
      const numberOfTokens = ethers.utils.parseUnits(
        params.value,
        params.tokenDecimals
      );
      const data = iface.functions.crossOut.encode([params.to, numberOfTokens, params.contractAddress]);
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
      const data = iface.functions.crossOut.encode([params.to, value, "0x0000000000000000000000000000000000000000"]);
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
      //console.log(transaction, 888);
      return await wallet.sign(transaction);
    }
  }

  /**
   * 跨链转入交易签名2 传入 gasPrice gasLimit
   * to nerve地址
   * value 转账金额
   * gasPrice
   * gasLimit
   * multySignAddress 多签地址
   * contractAddress token交易时合约地址
   * tokenDecimals token decimals
   */
  async getCrossInTxHexTwo(params) {
    //console.log(params);
    const wallet = await this.getWallet();
    const nonce = await wallet.getTransactionCount();
    const gasPrice = Number(params.gasPrice);
    const gasLimit = Number(params.gasLimit);
    const transaction = {to: params.multySignAddress, nonce, gasLimit: Number(gasLimit), gasPrice};
    const iface = new ethers.utils.Interface(CROSS_OUT_ABI);
    if (params.contractAddress) {
      // token转账
      const numberOfTokens = ethers.utils.parseUnits(params.value, params.tokenDecimals);
      const data = iface.functions.crossOut.encode([params.to, numberOfTokens, params.contractAddress]);
      transaction.from = params.from;
      transaction.value = "0x00";
      transaction.data = data;
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
      const data = iface.functions.crossOut.encode([params.to, value, "0x0000000000000000000000000000000000000000"]);
      transaction.value = value;
      transaction.data = data;
      const failed = await this.validate(transaction);
      if (failed) {
        console.error("failed: " + failed);
        return null;
      }
      //console.log(transaction, 999);
      return await wallet.sign(transaction);
    }
  }

  /**
   * 查询erc20资产授权额度
   * @param contractAddress ERC20合约地址
   * @param multySignAddress 多签地址
   * @param address 账户eth地址
   */
  async getERC20Allowance(contractAddress, multySignAddress, address) {
    const contract = new ethers.Contract(contractAddress, ERC20_ABI, this.provider);
    const allowancePromise = contract.allowance(address, multySignAddress);
    return allowancePromise
      .then(allowance => {
        //const baseAllowance = "100000000000000000000000000000000000000000000000000000000000000000000000000000";
        const baseAllowance = '39600000000000000000000000000';
        //已授权额度小于baseAllowance，则需要授权
        return Minus(baseAllowance, allowance) >= 0;
      })
      .catch(e => {
        console.error("获取erc20资产授权额度失败" + e);
        return true;
      });
  }

  /**
   * 授权erc20额度
   * @param contractAddress ERC20合约地址
   * @param multySignAddress 多签地址
   * @param address 账户eth地址
   */
  async getApproveERC20Hex(contractAddress, multySignAddress, address) {
    const wallet = await this.getWallet();
    const nonce = await wallet.getTransactionCount();
    const gasPrice = await this.provider.getGasPrice();
    const gasLimit = "100000";

    const iface = new ethers.utils.Interface(ERC20_ABI);
    const data = iface.functions.approve.encode([
      multySignAddress,
      new ethers.utils.BigNumber("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
    ]);
    const transaction = {
      to: contractAddress,
      from: address,
      value: "0x00",
      data: data,
      nonce,
      gasLimit: Number(gasLimit),
      gasPrice
    };
    const failed = await this.validate(transaction);
    if (failed) {
      console.error("failed approveERC20" + failed);
      return null;
    }
    delete transaction.from;
    return await wallet.sign(transaction);
    // delete transaction.from   //etherjs 4.0 from参数无效 报错
    // return wallet.sendTransaction(transaction);
  }

  // 获取手续费
  getGasPrice(gasLimit) {
    return this.provider.getGasPrice().then(gasPrice => {
      return ethers.utils.formatEther(gasPrice.mul(gasLimit).toString()).toString();
    });
  }

  // 加速手续费
  async getSpeedUpFee(gasLimit) {
    const gasPrice = await this.getSpeedUpGasPrice();
    return ethers.utils.formatEther(gasPrice.mul(gasLimit).toString()).toString();
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
    //console.log(nvtUSD, heterogeneousChainUSD, isToken);
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
    //console.log('result: ' + result.toString());
    const numberStr = ethers.utils.formatUnits(result, 8).toString();
    const ceil = Math.ceil(numberStr);
    //console.log('ceil: ' + ceil);
    const finalResult = ethers.utils.parseUnits(ceil.toString(), 8);
    //console.log('finalResult: ' + finalResult);
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
    //console.log(gasPrice);
    //console.log(gasLimit);
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

  /**
   * @desc 签名message
   * @param {string} dataHex // 签名内容
   * @param {string} pri
   */
  async signMessage(dataHex, pri) {
    const wallet = await this.getWallet(pri);
    return wallet.signMessage(dataHex);
  }
}

// 验证signMessage
// const message = "Example `personal_sign` message";
/* const message = "123456";
const pri = "32a78bf8cb9527771f3938c388365d1e084a8d506d39a4cc7036622dbb6344c1"
try {
  // debugger
  const signValue = sdk.signature(message.toString("hex"), pri);
  console.log(signValue, "n-transfer");
} catch (e){
  console.log(e, "===error===")
}
 

const E = new ETransfer({chain: "Ethereum", network: "beta"})
E.signMessage(message, pri).then(res => console.log(res, "e-transfer"))

const old = "3045022100cf957335e32e9e3dc491182e3e5a33e5de461b7dbb870d127fbbae00cd24845102204ad13b0924d392e633da32900e53442c00bb6eb4dae1fcaef1d2851df4ba276d"
const pub = "022fb21df00d78dd85d4700a10da7021b3a84d2d9f5998f3eb3ac0e9e76d98246c"
const v = sdk.verifySign(message, old, pub)
console.log(v, "验证结果") */

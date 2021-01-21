import {request} from "./request";
import {Times, timesDecimals, Plus, Division, getStorage} from "./util";
import sdk from "nerve-sdk-js/lib/api/sdk";
import utils from "nuls-sdk-js/lib/utils/utils";

/**
 * from
 * to
 * price
 * contractAddress
 * methodName
 * amount  转账数量
 * decimals 转账资产精度
 */
export async function getContractCallData(from, to, price, contractAddress, methodName, amount, decimals) {
  const gasLimit = sdk.CONTRACT_MAX_GASLIMIT;
  const methodDesc = "";
  let newValue = 0;
  let args = [];
  let newContractAddress = contractAddress;
  if (methodName === "transfer") {
    /// nuls 合约资产  普通token转账、向合约地址转token
    args = [to, timesDecimals(amount, decimals)]
  } else if (methodName === "_payable") {
    //合约 payable 向合约地址转nuls
    newValue = Number(Times(amount, 100000000));
    newContractAddress = to;
  } else if (methodName === "transferCrossChain") {
    // token跨链转账
    args = [to, timesDecimals(amount, decimals)];
    newValue = Number(timesDecimals(0.1, 8));
  }
  return await validateContractCall(from, newValue, gasLimit, price, newContractAddress, methodName, methodDesc, args)
}

/**
 * 验证调用合约交易
 * @param sender
 * @param value
 * @param gasLimit
 * @param price
 * @param contractAddress
 * @param methodName
 * @param methodDesc
 * @param args
 */
async function validateContractCall(sender, value, gasLimit, price, contractAddress, methodName, methodDesc, args) {
  //console.log(sender, value, gasLimit, price, contractAddress, methodName, methodDesc, args);
  try {
    const params = {
      chain: "NULS",
      address: sender,
      value,
      gasLimit,
      gasPrice: price,
      contractAddress,
      methodName,
      methodDesc,
      args
    };
    const res = await request({
      url: "/contract/validate/call",
      data: params
    });
    if (res.code === 1000) {
      return await imputedContractCallGas(sender, value, contractAddress, methodName, methodDesc, args, price)
    } else {
      return {success: false, msg: res.msg};
    }
  } catch (e) {
    return {success: false, msg: e};
  }
}

/**
 * 预估调用合约交易的gas
 * @param sender
 * @param value
 * @param contractAddress
 * @param methodName
 * @param methodDesc
 * @param args
 * @param price
 */
async function imputedContractCallGas(sender, value, contractAddress, methodName, methodDesc, args, price) {
  try {
    const params = {chain: "NULS", address: sender, value, contractAddress, methodName, methodDesc, args};
    const res = await request({url: "/contract/imputed/call/gas", data: params});
    if (res.code === 1000) {
      const contractConstructorArgsTypes = await getContractMethodArgsTypes(contractAddress, methodName);
      if (!contractConstructorArgsTypes.success) {
        console.log(JSON.stringify(contractConstructorArgsTypes.data));
        return {success: false, msg: contractConstructorArgsTypes.data};
      }
      const newArgs = utils.twoDimensionalArray(args, contractConstructorArgsTypes.data);

      const network = await getStorage("network");
      const config = JSON.parse(sessionStorage.getItem("config"));
      const MAIN_INFO = config[network].NULS;
      const data = {
        fee: Number(Plus(Division(Times(res.data.gasLimit, price), 10000000), 0.001)),
        gas: res.data.gasLimit,
        contractCallData: {
          chainId: MAIN_INFO.chainId,
          sender: sender,
          contractAddress: contractAddress,
          value: value,
          gasLimit: res.data.gasLimit,
          price: price,
          methodName: methodName,
          methodDesc: methodDesc,
          args: newArgs
        }
      };
      return {success: true, data}
    } else {
      return {success: false, msg: res.msg};
    }
  } catch (e) {
    return {success: false, msg: e};
  }
}

// 获取合约指定函数的参数类型
async function getContractMethodArgsTypes(contractAddress, methodName) {
  const params = {chain: "NULS", contractAddress, methodName, methodDesc: ""};
  const res = await request({url: "/contract/method/args/type", data: params});
  if (res.code === 1000) {
    return {success: true, data: res.data};
  } else {
    return {success: false, data: res.data};
  }
}

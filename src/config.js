const config = {
  beta: {
    BASE_URL: "http://nabox_api.zhoulijun.top/nabox-api",
    // BASE_URL: "http://192.168.1.18:8083/nabox-api",
    NULS: {chainId: 2, assetId: 1, prefix: "tNULS", symbol: "tNULS", decimal: 8},
    NERVE: {chainId: 5, assetId: 1, prefix: "TNVT", symbol: "NVT", decimal: 8},
    chainInfo: {NULS: 2, NERVE: 5, Ethereum: "0x3", BSC: "0x61", Heco: "0x100", OKExChain: '0x41'}
  },
  main: {
    BASE_URL: "http://api.v2.nabox.io/nabox-api",
    NULS: {chainId: 1, assetId: 1, prefix: "NULS", symbol: "NULS", decimal: 8},
    NERVE: {chainId: 9, assetId: 1, prefix: "NERVE", symbol: "NVT", decimal: 8},
    chainInfo: {NULS: 1, NERVE: 9, Ethereum: "0x1", BSC: "0x38", Heco: "0x80", OKExChain: '0x42'}
  },
};

export {config};


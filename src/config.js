const config = {
  beta: {
    BASE_URL: "http://192.168.1.7:8083/nabox-api",
    NULS: {
      chainId: 2,
      assetId: 1,
      prefix: "tNULS",
      symbol: "tNULS",
      decimal: 8
    },
    NERVE: {
      chainId: 5,
      assetId: 1,
      prefix: "TNVT",
      symbol: "NVT",
      decimal: 8
    }
  },
  main: {
    BASE_URL: "http://192.168.1.7:8083/nabox-api",
    NULS: {
      chainId: 1,
      assetId: 1,
      prefix: "NULS",
      symbol: "NULS",
      decimal: 8
    },
    NERVE: {
      chainId: 9,
      assetId: 1,
      prefix: "NERVE",
      symbol: "NVT",
      decimal: 8
    }
  }
};

export { config };

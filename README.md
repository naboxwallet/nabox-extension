## Nabox Chrome Extension_1.0

### Development
```
npm install
npm run dev
```

### Build for Publishing
```
npm run build
```


### To check if nabox is installed
```
if (typeof window.nabox !== "undefined") {
  console.log("nabox is installed!");
}
```

### Connect to nabox
```
await nabox.createSession()
```

### Subscribe events
```
nabox.on("connect", (error, payload) => {
  if (error) {
    throw error;
  }
  const { accounts, chainId } = payload.params[0];
});

nabox.on("session_update", (error, payload) => {
  if (error) {
    throw error;
  }

  const { accounts, chainId } = payload.params[0];
});

nabox.on("disconnect", (error, payload) => {
  if (error) {
    throw error;
  }
});
```

### Send transaction & Sign transaction
```
// On Ethereum Bsc Heco
const tx = {
  from: "0xbc28Ea04101F03aA7a94C1379bc3AB32E65e62d3", // Optional (plug-in currently connected account)
  to: "0x89D24A7b4cCB1b6fAA2625Fe562bDd9A23260359", // Required (for non contract deployments)
  data: "0x", // Required
  value: "0x00", // Required
};

// On NULS NERVE
const tx = {
  from: "TNVTdTSPVcqUCdfVYWwrbuRtZ1oM6GpSgsgF5",
  to: "TNVTdTSPSSLNLNCQMxksTiWj7BTZccXhMyjXk",
  value: "1",
  assetChainId: 2,
  assetId: 1,
  contractAddress: "", // (if it is a contract asset)
}

// Send transaction
nabox
  .sendTransaction(tx)
  .then(result => {
    // Returns transaction id (hash)
    console.log(result);
  })
  .catch(error => {
    console.error(error);
  });

// Sign transaction
nabox
  .signTransaction(tx)
  .then(result => {
    // Returns signed transaction
    console.log(result);
  })
  .catch(error => {
    console.error(error);
  });
```


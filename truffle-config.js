require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: 5777,
      gas: 6721975,
      gasPrice: 20000000000,
    },
    sepolia: {
  provider: () => new HDWalletProvider(
    process.env.PRIVATE_KEY,
    process.env.SEPOLIA_RPC
  ),
  network_id: 11155111,
  confirmations: 2,
  timeoutBlocks: 200,
  skipDryRun: true,
  networkCheckTimeout: 100000
}
  },

  mocha: {
    timeout: 100000
  },

  compilers: {
    solc: {
      version: "0.8.21",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "london"
      }
    }
  }
};
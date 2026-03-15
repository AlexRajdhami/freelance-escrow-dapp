require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  networks: {
   development: {
  host: "127.0.0.1",
  port: 7545,
  network_id: "5777",  // match Ganache exactly
},
    sepolia: {
      provider: () => new HDWalletProvider(
        process.env.MNEMONIC,
        `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
      ),
      network_id: 11155111,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
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
        }
      }
    }
  }
};
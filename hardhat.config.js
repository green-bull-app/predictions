require("@nomiclabs/hardhat-waffle");

require("dotenv").config();

const rpc = process.env.POLY_RPC;

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  networks: {
    hardhat: {
      forking: {
        url: rpc,
      }
    },
    polygon_main: {
      url: rpc,
      chainId: 137,
      accounts: [process.env.TREASURY_PRIVATE_KEY]
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};

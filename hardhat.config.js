require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.22",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545/",
    },
    base: {
      url: process.env.BASE_MAINNET_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8453,  // Chain ID for Base mainnet
    },
    baseSep: {
      url: process.env.BASE_SEPOLIA_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,  // Chain ID for Base Sepolia
    },
  },
  etherscan: {
    apiKey: process.env.BASESCAN_API_KEY,  // Optional: For contract verification
  },
};

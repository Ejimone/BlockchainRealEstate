require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1, // Reduce runs for smaller contract size
      },
      viaIR: true, // Enable IR-based code generator for better optimization
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
      allowUnlimitedContractSize: true,
    },
    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 1337,
      gas: 30000000,
      gasPrice: 2000000000, // Increased to 2 gwei
      accounts: [
        "0xb2d0458bc3d84fd357e2cddbb149e99da99f4ca56141f09e98ffaa6fc981fc48",
        "0x72bfc95264a2223b93ad40a5204df332a1fc35774eba4114f65b7546a6f8c044"
      ],
      timeout: 60000,
      allowUnlimitedContractSize: true,
      blockGasLimit: 30000000,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
      allowUnlimitedContractSize: true,
    },
  },
};

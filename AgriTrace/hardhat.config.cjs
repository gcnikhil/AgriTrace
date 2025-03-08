require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    ganache: {
        url: "http://127.0.0.1:8545", // Ganache's RPC server URL
        accounts: [
            "3cf57b63c9dc4146344545b06d70ffed28467b3b30fb85cf4fa1f30a9548d8ce"
              ],
    },
},
};

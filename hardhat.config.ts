import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    localhost: {},
  },
  //@ts-ignore
  plugins: ["@nomiclabs/hardhat-ethers"],
};

export default config;

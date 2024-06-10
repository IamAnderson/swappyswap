import { ethers } from "hardhat";

async function main() {
  //Fetch contract to deploy
  const Token = await ethers.getContractFactory("Token");

  //Deploy contract
  const token = await Token.deploy();
  console.log(`Token deployed to: ${token.address}`);
}

main().catch((error) => {
  console.error(error);
  //@ts-ignore
  process.exitCode = 1;
});

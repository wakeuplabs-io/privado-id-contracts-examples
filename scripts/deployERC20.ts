import { ethers, upgrades } from 'hardhat';

const contractName = 'ERC20Verifier';
const name = 'ERC20ZKPVerifier';
const symbol = 'ERCZKP';

async function main() {
  const ERC20ContractFactory = await ethers.getContractFactory(contractName);
  const erc20instance = await upgrades.deployProxy(ERC20ContractFactory, [name, symbol]);

  await erc20instance.waitForDeployment();
  console.log(contractName, ' deployed to:', await erc20instance.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

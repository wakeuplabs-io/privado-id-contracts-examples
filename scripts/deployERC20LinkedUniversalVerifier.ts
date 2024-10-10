import { ethers } from 'hardhat';

// current universal verifier smart contract on opt-sepolia
const UNIVERSAL_VERIFIER = '0x102eB31F9f2797e8A84a79c01FFd9aF7D1d9e556';
const verifierName = 'ERC20LinkedUniversalVerifier';
const verifierSymbol = 'zkERC20';

async function main() {
  const verifier = await ethers.deployContract(verifierName, [
    UNIVERSAL_VERIFIER,
    verifierName,
    verifierSymbol
  ]);
  await verifier.waitForDeployment();
  console.log(verifierName, ' contract address:', await verifier.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

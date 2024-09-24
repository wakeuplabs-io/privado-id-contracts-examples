import { ethers } from 'hardhat';

// opt-sepolia
const universalVerifierAddress = '0x102eB31F9f2797e8A84a79c01FFd9aF7D1d9e556';

async function main() {
  if (!ethers.isAddress(universalVerifierAddress)) {
    throw new Error('Please set universal verifier address');
  }
  const verifierName = 'ERC20LinkedUniversalVerifier';
  const verifierSymbol = 'zkERC20';

  const verifier = await ethers.deployContract(verifierName, [
    universalVerifierAddress,
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

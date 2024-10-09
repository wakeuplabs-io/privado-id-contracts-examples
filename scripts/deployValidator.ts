import { ethers, upgrades } from 'hardhat';
import fs from 'fs';
import path from 'path';

// current state smart contract on opt-sepolia
const STATE_ADDRESS = '0x9a1A258702050BcFB938Ad8Ec0996503473216d1';
const VERIFIER_CONTRACT_NAME = 'VerifierV3Wrapper';
const VALIDATOR_CONTRACT_NAME = 'CredentialAtomicQueryV3Validator';
const PATH_OUTPUT_JSON = path.join(__dirname, './deploy_validator_output.json');

async function main() {
  const VerifierWrapper = await ethers.getContractFactory(VERIFIER_CONTRACT_NAME);
  const verifierWrapper = await VerifierWrapper.deploy();

  await verifierWrapper.waitForDeployment();
  console.log(VERIFIER_CONTRACT_NAME, ' deployed to:', await verifierWrapper.getAddress());

  const CredentialAtomicQueryValidator = await ethers.getContractFactory(VALIDATOR_CONTRACT_NAME);
  const CredentialAtomicQueryValidatorProxy = await upgrades.deployProxy(
    CredentialAtomicQueryValidator,
    [await verifierWrapper.getAddress(), STATE_ADDRESS]
  );

  await CredentialAtomicQueryValidatorProxy.waitForDeployment();
  console.log(
    VALIDATOR_CONTRACT_NAME,
    ' deployed to:',
    await CredentialAtomicQueryValidatorProxy.getAddress()
  );

  const outputJson = {
    verifierContractWrapperName: VERIFIER_CONTRACT_NAME,
    validatorContractName: VALIDATOR_CONTRACT_NAME,
    validator: await CredentialAtomicQueryValidatorProxy.getAddress(),
    verifier: await verifierWrapper.getAddress(),
    network: process.env.HARDHAT_NETWORK
  };
  fs.writeFileSync(PATH_OUTPUT_JSON, JSON.stringify(outputJson, null, 1));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

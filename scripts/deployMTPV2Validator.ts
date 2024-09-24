import { ethers, upgrades } from 'hardhat';
import fs from 'fs';
import path from 'path';

const pathOutputJson = path.join(__dirname, './deploy_validator_output.json');

async function main() {
  // const stateAddress = 'TODO:'; // current state smart contract on opt
  const stateAddress = '0x9a1A258702050BcFB938Ad8Ec0996503473216d1'; // current state smart contract on opt-sepolia

  const verifierContractWrapperName = 'VerifierMTPWrapper';
  const validatorContractName = 'CredentialAtomicQueryMTPV2Validator';
  const VerifierMTPWrapper = await ethers.getContractFactory(verifierContractWrapperName);
  const verifierWrapper = await VerifierMTPWrapper.deploy();

  await verifierWrapper.waitForDeployment();
  console.log(verifierContractWrapperName, ' deployed to:', await verifierWrapper.getAddress());

  const CredentialAtomicQueryValidator = await ethers.getContractFactory(validatorContractName);

  const CredentialAtomicQueryValidatorProxy = await upgrades.deployProxy(
    CredentialAtomicQueryValidator,
    [await verifierWrapper.getAddress(), stateAddress] // current state address on mumbai
  );

  await CredentialAtomicQueryValidatorProxy.waitForDeployment();
  console.log(
    validatorContractName,
    ' deployed to:',
    await CredentialAtomicQueryValidatorProxy.getAddress()
  );

  const outputJson = {
    verifierContractWrapperName,
    validatorContractName,
    validator: await CredentialAtomicQueryValidatorProxy.getAddress(),
    verifier: await verifierWrapper.getAddress(),
    network: process.env.HARDHAT_NETWORK
  };
  fs.writeFileSync(pathOutputJson, JSON.stringify(outputJson, null, 1));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

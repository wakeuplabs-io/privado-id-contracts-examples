import { StateDeployHelper } from '../test/helpers/StateDeployHelper';

async function main() {
  // opt-sepolia
  const validatorContractAddress = '0xd52131eDC6777d7F7199663dc1629307E13d723A';
  const validatorContractName = 'CredentialAtomicQueryV3Validator';

  const stateDeployHelper = await StateDeployHelper.initialize();

  const v = await stateDeployHelper.upgradeValidator(
    validatorContractAddress,
    validatorContractName
  );
  console.log(validatorContractName, 'validator upgraded on ', await v.validator.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

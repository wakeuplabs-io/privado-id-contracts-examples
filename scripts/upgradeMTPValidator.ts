import { StateDeployHelper } from '../test/helpers/StateDeployHelper';

async function main() {
  // current smart contracts on opt-sepolia
  const validatorContractAddress = '0x5EDbb8681312bA0e01Fd41C759817194b95ee604';
  const validatorContractName = 'CredentialAtomicQueryMTPV2Validator';

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

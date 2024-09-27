import { StateDeployHelper } from '../test/helpers/StateDeployHelper';

async function main() {
  // current smart contracts on opt-sepolia
  const validatorContractAddress = '0x6e009702a8b16Dca15Fa145E3906B13E75Dc516e';
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

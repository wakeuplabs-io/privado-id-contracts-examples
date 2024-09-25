import { StateDeployHelper } from '../test/helpers/StateDeployHelper';

async function main() {
  const validatorContractAddress = '0xbA308e870d35A092810a3F0e4d21ece65551dE42'; // opt-sepolia
  const validatorContractName = 'CredentialAtomicQuerySigV2Validator';

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

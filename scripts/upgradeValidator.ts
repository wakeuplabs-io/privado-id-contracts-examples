import { StateDeployHelper } from '../test/helpers/StateDeployHelper';

// current smart contracts on opt-sepolia
// CredentialAtomicQueryV3Validator or CredentialAtomicQueryMTPV2Validator or CredentialAtomicQuerySigV2Validator
const VALIDATOR_CONTRACT_NAME = '...';
const VALIDATOR_CONTRACT_ADDRESS = '...';

async function main() {
  const stateDeployHelper = await StateDeployHelper.initialize();

  const v = await stateDeployHelper.upgradeValidator(
    VALIDATOR_CONTRACT_ADDRESS,
    VALIDATOR_CONTRACT_NAME
  );
  console.log(VALIDATOR_CONTRACT_NAME, 'validator upgraded on ', await v.validator.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

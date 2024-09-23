import { ethers, upgrades } from 'hardhat';
import { StateDeployHelper } from '../helpers/StateDeployHelper';
import { Contract } from 'ethers';

export async function deploySpongePoseidon(poseidon6ContractAddress: string): Promise<Contract> {
  const SpongePoseidonFactory = await ethers.getContractFactory('SpongePoseidon', {
    libraries: {
      PoseidonUnit6L: poseidon6ContractAddress
    }
  });

  const spongePoseidon = await SpongePoseidonFactory.deploy();
  await spongePoseidon.waitForDeployment();
  console.log('SpongePoseidon deployed to:', await spongePoseidon.getAddress());
  return spongePoseidon;
}

export async function deployValidatorContracts(
  verifierContractWrapperName: string,
  validatorContractName: string,
  stateAddress = ''
): Promise<{
  state: any;
  verifierWrapper: any;
  validator: any;
}> {
  if (stateAddress === '') {
    const stateDeployHelper = await StateDeployHelper.initialize();
    const { state } = await stateDeployHelper.deployState(undefined, [
      // id types from common-data fixtures
      '0x0100',
      '0x0112',
      '0x0212'
    ]);
    stateAddress = await state.getAddress();
  }

  const ValidatorContractVerifierWrapper = await ethers.getContractFactory(
    verifierContractWrapperName
  );
  const validatorContractVerifierWrapper = await ValidatorContractVerifierWrapper.deploy();

  await validatorContractVerifierWrapper.waitForDeployment();
  console.log(
    'Validator Verifier Wrapper deployed to:',
    await validatorContractVerifierWrapper.getAddress()
  );

  const ValidatorContract = await ethers.getContractFactory(validatorContractName);

  const validatorContractProxy = await upgrades.deployProxy(ValidatorContract, [
    await validatorContractVerifierWrapper.getAddress(),
    stateAddress
  ]);

  await validatorContractProxy.waitForDeployment();
  console.log(`${validatorContractName} deployed to: ${await validatorContractProxy.getAddress()}`);
  const signers = await ethers.getSigners();

  const state = await ethers.getContractAt('State', stateAddress, signers[0]);
  return {
    validator: validatorContractProxy,
    verifierWrapper: validatorContractVerifierWrapper,
    state
  };
}

export async function deployERC20ZKPVerifierToken(
  name: string,
  symbol: string,
  contractName = 'ERC20Verifier'
): Promise<Contract> {
  const ERC20Verifier = await ethers.getContractFactory(contractName);
  const erc20Verifier = await upgrades.deployProxy(ERC20Verifier, [name, symbol]);
  console.log(contractName + ' deployed to:', await erc20Verifier.getAddress());
  return erc20Verifier;
}

export interface VerificationInfo {
  inputs: Array<string>;
  pi_a: Array<string>;
  pi_b: Array<Array<string>>;
  pi_c: Array<string>;
}

export function prepareInputs(json: any): VerificationInfo {
  const { proof, pub_signals } = json;
  const { pi_a, pi_b, pi_c } = proof;
  const [[p1, p2], [p3, p4]] = pi_b;
  const preparedProof = {
    pi_a: pi_a.slice(0, 2),
    pi_b: [
      [p2, p1],
      [p4, p3]
    ],
    pi_c: pi_c.slice(0, 2)
  };

  return { inputs: pub_signals, ...preparedProof };
}

export function toBigNumber({ inputs, pi_a, pi_b, pi_c }: VerificationInfo) {
  return {
    inputs: inputs.map((input) => BigInt(input)),
    pi_a: pi_a.map((input) => BigInt(input)),
    pi_b: pi_b.map((arr) => arr.map((input) => BigInt(input))),
    pi_c: pi_c.map((input) => BigInt(input))
  };
}

export async function publishState(
  state: Contract,
  json: { [key: string]: string }
): Promise<{
  oldState: string;
  newState: string;
  id: string;
  blockNumber: number;
  timestamp: number;
}> {
  const {
    inputs: [id, oldState, newState, isOldStateGenesis],
    pi_a,
    pi_b,
    pi_c
  } = prepareInputs(json);

  const transitStateTx = await state.transitState(
    id,
    oldState,
    newState,
    isOldStateGenesis === '1',
    pi_a,
    pi_b,
    pi_c
  );

  const { blockNumber } = await transitStateTx.wait();
  const block = await ethers.provider.getBlock(transitStateTx.blockNumber);
  if (block === null) {
    throw new Error('Block not found');
  }

  return {
    oldState,
    newState,
    id,
    blockNumber,
    timestamp: block.timestamp
  };
}

export function toJson(data) {
  return JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? `${v}n` : v)).replace(
    /"(-?\d+)n"/g,
    (_, a) => a
  );
}

export async function deployClaimBuilder(enableLogging = false): Promise<Contract> {
  const ClaimBuilder = await ethers.getContractFactory('ClaimBuilder');
  const cb = await ClaimBuilder.deploy();
  await cb.waitForDeployment();
  enableLogging && console.log(`ClaimBuilder deployed to: ${await cb.getAddress()}`);

  return cb;
}

export async function deployIdentityLib(
  smtpAddress: string,
  poseidonUtil3lAddress: string,
  poseidonUtil4lAddress: string,
  enableLogging = false
): Promise<Contract> {
  const Identity = await ethers.getContractFactory('IdentityLib', {
    libraries: {
      SmtLib: smtpAddress,
      PoseidonUnit3L: poseidonUtil3lAddress,
      PoseidonUnit4L: poseidonUtil4lAddress
    }
  });
  const il = await Identity.deploy();
  await il.waitForDeployment();
  enableLogging && console.log(`IdentityLib deployed to: ${await il.getAddress()}`);

  return il;
}

export async function deployClaimBuilderWrapper(enableLogging = false): Promise<{
  address: string;
}> {
  const cb = await deployClaimBuilder(enableLogging);

  const ClaimBuilderWrapper = await ethers.getContractFactory('ClaimBuilderWrapper', {
    libraries: {
      ClaimBuilder: await cb.getAddress()
    }
  });
  const claimBuilderWrapper = await ClaimBuilderWrapper.deploy();
  enableLogging && console.log('ClaimBuilder deployed to:', await claimBuilderWrapper.getAddress());
  return { address: await claimBuilderWrapper.getAddress() };
}

export async function deployERC20LinkedUniversalVerifier(
  name: string,
  symbol: string
): Promise<{
  universalVerifier: Contract;
  erc20LinkedUniversalVerifier: Contract;
}> {
  const UniversalVerifier = await ethers.getContractFactory('UniversalVerifier');
  const universalVerifier = await upgrades.deployProxy(UniversalVerifier);
  const ERC20LinkedUniversalVerifier = await ethers.getContractFactory(
    'ERC20LinkedUniversalVerifier'
  );
  const erc20LinkedUniversalVerifier = await ERC20LinkedUniversalVerifier.deploy(
    await universalVerifier.getAddress(),
    name,
    symbol
  );
  console.log(
    'ERC20LinkedUniversalVerifier deployed to:',
    await erc20LinkedUniversalVerifier.getAddress()
  );
  return {
    universalVerifier,
    erc20LinkedUniversalVerifier
  };
}

export async function deployERC721LinkedUniversalVerifier(
  name: string,
  symbol: string
): Promise<{
  universalVerifier: Contract;
  erc721LinkedUniversalVerifier: Contract;
}> {
  const UniversalVerifier = await ethers.getContractFactory('UniversalVerifier');
  const universalVerifier = await upgrades.deployProxy(UniversalVerifier);
  const ERC721LinkedUniversalVerifier = await ethers.getContractFactory(
    'ERC721LinkedUniversalVerifier'
  );
  const erc721LinkedUniversalVerifier = await ERC721LinkedUniversalVerifier.deploy(
    await universalVerifier.getAddress(),
    name,
    symbol
  );
  console.log(
    'ERC721LinkedUniversalVerifier deployed to:',
    await erc721LinkedUniversalVerifier.getAddress()
  );
  return {
    universalVerifier,
    erc721LinkedUniversalVerifier
  };
}

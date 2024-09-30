import fs from 'fs';
import { ethers } from 'hardhat';
import path from 'path';
import { OnchainIdentityDeployHelper } from '../test/helpers/OnchainIdentityDeployHelper';
import { StateDeployHelper } from '../test/helpers/StateDeployHelper';
import { deployPoseidons } from '../test/utils/deploy-poseidons.util';
const pathOutputJson = path.join(__dirname, './deploy_output.json');

async function main() {
  // current state smart contract on opt-sepolia
  const stateAddress = '0x9a1A258702050BcFB938Ad8Ec0996503473216d1';

  const owner = (await ethers.getSigners())[0];
  const [poseidon2Elements, poseidon3Elements, poseidon4Elements] = await deployPoseidons(
    owner,
    [2, 3, 4]
  );

  const stDeployHelper = await StateDeployHelper.initialize([owner], true);
  const smtLib = await stDeployHelper.deploySmtLib(
    await poseidon2Elements.getAddress(),
    await poseidon3Elements.getAddress()
  );

  const deployHelper = await OnchainIdentityDeployHelper.initialize([owner], true);
  const contracts = await deployHelper.deployIdentity(
    stateAddress,
    smtLib,
    poseidon3Elements,
    poseidon4Elements
  );

  const identity = contracts.identity;

  const outputJson = {
    state: stateAddress,
    smtLib: await smtLib.getAddress(),
    identity: await identity.getAddress(),
    poseidon2: await poseidon2Elements.getAddress(),
    poseidon3: await poseidon3Elements.getAddress(),
    poseidon4: await poseidon4Elements.getAddress(),
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

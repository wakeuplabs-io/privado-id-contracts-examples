import fs from 'fs';
import path from 'path';
import { BalanceCredentialIssuerDeployHelper } from '../test/helpers/BalanceCredentialIssuerDeployHelper';
import { deployPoseidons } from '../test/utils/deploy-poseidons.util';
import { StateDeployHelper } from '../test/helpers/StateDeployHelper';
import { ethers } from 'hardhat';

const STATE_ADDRESS = '0x9a1A258702050BcFB938Ad8Ec0996503473216d1'; // current state smart contract on opt-sepolia
const PATH_OUTPUT_JSON = path.join(__dirname, './deploy_output.json');

async function main() {
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

  const balanceCredentialIssuerDeployer = await BalanceCredentialIssuerDeployHelper.initialize(
    [owner],
    true
  );
  const contracts = await balanceCredentialIssuerDeployer.deployBalanceCredentialIssuer(
    smtLib,
    poseidon3Elements,
    poseidon4Elements,
    STATE_ADDRESS
  );

  const outputJson = {
    state: STATE_ADDRESS,
    smtLib: await smtLib.getAddress(),
    balanceCredentialIssuer: await contracts.balanceCredentialIssuer.getAddress(),
    poseidon2: await poseidon2Elements.getAddress(),
    poseidon3: await poseidon3Elements.getAddress(),
    poseidon4: await poseidon4Elements.getAddress(),
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

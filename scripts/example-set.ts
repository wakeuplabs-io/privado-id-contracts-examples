import hre from 'hardhat';
import Web3 from 'web3';
import { poseidon } from '@iden3/js-crypto';
import { SchemaHash } from '@iden3/js-iden3-core';
import { prepareCircuitArrayValues } from '@0xpolygonid/js-sdk';

// Put your values here
const ERC20_VERIFIER_ADDRESS = '0xbdBd12A480FC1C3B13EA8801d2D2C4c56CC05Bb6';
const VALIDATOR_ADDRESS = '0xA1354eA26deE36639083f9EC106a52b0B351Bb08';
const UNIVERSAL_VERIFIER_ADDRESS = '0xAf7A10FbBF614bCa1e8301a6d82D076C779bA276';

const Operators = {
  NOOP: 0, // No operation, skip query verification in circuit
  EQ: 1, // equal
  LT: 2, // less than
  GT: 3, // greater than
  IN: 4, // in
  NIN: 5, // not in
  NE: 6 // not equal
};

function packValidatorParams(query, allowedIssuers = []) {
  const web3 = new Web3(Web3.givenProvider || 'ws://localhost:8545');
  return web3.eth.abi.encodeParameter(
    {
      CredentialAtomicQuery: {
        schema: 'uint256',
        claimPathKey: 'uint256',
        operator: 'uint256',
        slotIndex: 'uint256',
        value: 'uint256[]',
        queryHash: 'uint256',
        allowedIssuers: 'uint256[]',
        circuitIds: 'string[]',
        skipClaimRevocationCheck: 'bool',
        claimPathNotExists: 'uint256'
      }
    },
    {
      schema: query.schema,
      claimPathKey: query.claimPathKey,
      operator: query.operator,
      slotIndex: query.slotIndex,
      value: query.value,
      queryHash: query.queryHash,
      allowedIssuers: allowedIssuers,
      circuitIds: query.circuitIds,
      skipClaimRevocationCheck: query.skipClaimRevocationCheck,
      claimPathNotExists: query.claimPathNotExists
    }
  );
}

function coreSchemaFromStr(schemaIntString) {
  const schemaInt = BigInt(schemaIntString);
  return SchemaHash.newSchemaHashFromInt(schemaInt);
}

function calculateQueryHashV2(
  values,
  schema,
  slotIndex,
  operator,
  claimPathKey,
  claimPathNotExists
) {
  const expValue = prepareCircuitArrayValues(values, 64);
  const valueHash = poseidon.spongeHashX(expValue, 6);
  const schemaHash = coreSchemaFromStr(schema);
  const quaryHash = poseidon.hash([
    schemaHash.bigInt(),
    BigInt(slotIndex),
    BigInt(operator),
    BigInt(claimPathKey),
    BigInt(claimPathNotExists),
    valueHash
  ]);
  return quaryHash;
}

async function main() {
  // you can run https://go.dev/play/p/oB_oOW7kBEw to get schema hash and claimPathKey using YOUR schema
  const schemaBigInt = '74977327600848231385663280181476307657';

  const type = 'KYCAgeCredential';
  const schemaUrl =
    'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld';
  // merklized path to field in the W3C credential according to JSONLD  schema e.g. birthday in the KYCAgeCredential under the url "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld"
  const schemaClaimPathKey =
    '20376033832371109177683048456014525905119173674985843915445634726167450989630';

  const requestId = 1;

  const query: any = {
    requestId,
    schema: schemaBigInt,
    claimPathKey: schemaClaimPathKey,
    operator: Operators.LT,
    slotIndex: 0,
    value: [20020101, ...new Array(63).fill(0)], // for operators 1-3 only first value matters
    circuitIds: ['credentialAtomicQuerySigV2OnChain'],
    skipClaimRevocationCheck: false,
    claimPathNotExists: 0
  };

  query.queryHash = calculateQueryHashV2(
    query.value,
    query.schema,
    query.slotIndex,
    query.operator,
    query.claimPathKey,
    query.claimPathNotExists
  ).toString();

  //   const erc20Verifier = await hre.ethers.getContractAt('ERC20Verifier', ERC20_VERIFIER_ADDRESS);

  const invokeRequestMetadata = {
    id: '7f38a193-0918-4a48-9fac-36adfdb8b542',
    typ: 'application/iden3comm-plain-json',
    type: 'https://iden3-communication.io/proofs/1.0/contract-invoke-request',
    thid: '7f38a193-0918-4a48-9fac-36adfdb8b542',
    body: {
      reason: 'airdrop participation',
      transaction_data: {
        contract_address: ERC20_VERIFIER_ADDRESS,
        method_id: 'b68967e2',
        chain_id: 11155420,
        network: 'opt-sepolia'
      },
      scope: [
        {
          id: query.requestId,
          circuitId: query.circuitIds[0],
          query: {
            allowedIssuers: ['*'],
            context: schemaUrl,
            credentialSubject: {
              birthday: {
                $lt: query.value[0]
              }
            },
            type
          }
        }
      ]
    }
  };

  try {
    // ############ Use this code to set request in ERC20Verifier ############

    // await erc20Verifier.setZKPRequest(requestId, {
    //   metadata: JSON.stringify(invokeRequestMetadata),
    //   validator: VALIDATOR_ADDRESS,
    //   data: packValidatorParams(query)
    // });

    // ############### Use this code to set request in Universal Verifier ############

    const universalVerifier = await hre.ethers.getContractAt(
      'UniversalVerifier',
      UNIVERSAL_VERIFIER_ADDRESS
    );

    await universalVerifier.addValidatorToWhitelist(VALIDATOR_ADDRESS);

    // You can call this method on behalf of any signer which is supposed to be request controller
    const tx = await universalVerifier.setZKPRequest(requestId, {
      metadata: JSON.stringify(invokeRequestMetadata),
      validator: VALIDATOR_ADDRESS,
      data: packValidatorParams(query)
    });
    await tx.wait();

    console.log('Request set', tx.hash);

    const res = await universalVerifier.getProofStatus(
      '0xF754D0f4de0e815b391D997Eeec5cD07E59858F0',
      1
    );
    console.log('res', res);
  } catch (e) {
    console.log('error: ', e);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

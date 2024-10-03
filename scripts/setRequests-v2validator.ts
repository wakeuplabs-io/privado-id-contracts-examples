import hre from 'hardhat';
import Web3 from 'web3';
import { poseidon } from '@iden3/js-crypto';
import { SchemaHash } from '@iden3/js-iden3-core';
import { CircuitId, prepareCircuitArrayValues } from '@wakeuplabs/opid-sdk';

// current smart contracts on opt-sepolia
const VERIFIER_CONTRACT = 'ERC20Verifier'; // UniversalVerifier or ERC20Verifier
const VERIFIER_ADDRESS = '0xca6bfa62791d3c7c7ed1a5b320018c1C1dAC89Ee'; // Universal Verifier (0x102eB31F9f2797e8A84a79c01FFd9aF7D1d9e556) or ERC20 Verifier (0xca6bfa62791d3c7c7ed1a5b320018c1C1dAC89Ee)
const SIGV2_VALIDATOR_ADDRESS = '0xbA308e870d35A092810a3F0e4d21ece65551dE42';
const MTP_VALIDATOR_ADDRESS = '0x6e009702a8b16Dca15Fa145E3906B13E75Dc516e';

const TRANSFER_REQUEST_ID_SIG_VALIDATOR = 1;
const TRANSFER_REQUEST_ID_MTP_VALIDATOR = 2;

const OPID_CHAIN_ID_SEPOLIA = 11155420;

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

function buildZkpRequest(requestId: number, circuit: CircuitId) {
  const query: any = {
    requestId,
    schema: '74977327600848231385663280181476307657', // you can run https://go.dev/play/p/oB_oOW7kBEw to get schema hash and claimPathKey using YOUR schema
    claimPathKey: '20376033832371109177683048456014525905119173674985843915445634726167450989630', // merklized path to field in the W3C credential according to JSONLD  schema e.g. birthday in the KYCAgeCredential under the url "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld"
    operator: Operators.LT,
    slotIndex: 0,
    value: [20020101, ...new Array(63).fill(0)], // for operators 1-3 only first value matters
    circuitIds: [circuit],
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

  const invokeRequestMetadata = {
    id: '7f38a193-0918-4a48-9fac-36adfdb8b542',
    typ: 'application/iden3comm-plain-json',
    type: 'https://iden3-communication.io/proofs/1.0/contract-invoke-request',
    thid: '7f38a193-0918-4a48-9fac-36adfdb8b542',
    body: {
      reason: 'airdrop participation',
      transaction_data: {
        contract_address: VERIFIER_ADDRESS,
        method_id: 'b68967e2',
        chain_id: OPID_CHAIN_ID_SEPOLIA,
        network: 'opt-sepolia'
      },
      scope: [
        {
          id: query.requestId,
          circuitId: query.circuitIds[0],
          query: {
            allowedIssuers: ['*'],
            context:
              'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld',
            credentialSubject: {
              birthday: {
                $lt: query.value[0]
              }
            },
            type: 'KYCAgeCredential'
          }
        }
      ]
    }
  };

  return {
    query,
    invokeRequestMetadata
  };
}

async function main() {
  try {
    const verifier = await hre.ethers.getContractAt(VERIFIER_CONTRACT, VERIFIER_ADDRESS);

    // // Only UniversalVerifier requires whitelisting
    // if (VERIFIER_CONTRACT === 'UniversalVerifier') {
    //   await verifier.addValidatorToWhitelist(SIGV2_VALIDATOR_ADDRESS);
    //   await verifier.addValidatorToWhitelist(MTP_VALIDATOR_ADDRESS);
    // }

    // set sig request
    const sigZkRequest = buildZkpRequest(
      TRANSFER_REQUEST_ID_SIG_VALIDATOR,
      CircuitId.AtomicQuerySigV2OnChain
    );
    const sigTx = await verifier.setZKPRequest(sigZkRequest.query.requestId, {
      metadata: JSON.stringify(sigZkRequest.invokeRequestMetadata),
      validator: SIGV2_VALIDATOR_ADDRESS,
      data: packValidatorParams(sigZkRequest.query)
    });
    await sigTx.wait();
    console.log('Sig zk request set', sigTx.hash);

    // set mtp request
    const mtpZkRequest = buildZkpRequest(
      TRANSFER_REQUEST_ID_MTP_VALIDATOR,
      CircuitId.AtomicQueryMTPV2OnChain
    );
    const mtpTx = await verifier.setZKPRequest(mtpZkRequest.query.requestId, {
      metadata: JSON.stringify(mtpZkRequest.invokeRequestMetadata),
      validator: MTP_VALIDATOR_ADDRESS,
      data: packValidatorParams(mtpZkRequest.query)
    });
    await mtpTx.wait();
    console.log('Mtp zk request set', mtpTx.hash);
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

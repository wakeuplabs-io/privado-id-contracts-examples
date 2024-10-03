import hre from 'hardhat';
import { SchemaHash } from '@iden3/js-iden3-core';
import { calculateQueryHashV3, CircuitId, core } from '@0xpolygonid/js-sdk';
import { buildVerifierId } from '../test/utils/utils';
import { packV3ValidatorParams } from '../test/utils/pack-utils';

// current smart contracts on opt-sepolia
const VERIFIER_CONTRACT = 'ERC20Verifier'; // UniversalVerifier or ERC20Verifier but ERC20Verifier doesn't currently support V3 proofs submit
const VERIFIER_ADDRESS = '0xF27c124616A8Fc816cd7ab0F4bbbFFAB35Dd7D47'; // Universal Verifier or ERC20 Verifier but ERC20Verifier doesn't currently support V3 proofs submit
const VALIDATOR_ADDRESS_V3 = '0xd52131eDC6777d7F7199663dc1629307E13d723A';

const TRANSFER_REQUEST_ID_V3_VALIDATOR = 3;

const OPID_METHOD = 'opid';
const OPID_BLOCKCHAIN = 'optimism';
const OPID_CHAIN_ID_MAIN = 10;
const OPID_CHAIN_ID_SEPOLIA = 11155420;
const OPID_NETWORK_MAIN = 'main';
const OPID_NETWORK_SEPOLIA = 'sepolia';

core.registerDidMethod(OPID_METHOD, 0b00000011);
core.registerDidMethodNetwork({
  method: OPID_METHOD,
  blockchain: OPID_BLOCKCHAIN,
  chainId: OPID_CHAIN_ID_SEPOLIA,
  network: OPID_NETWORK_SEPOLIA,
  networkFlag: 0b1000_0000 | 0b0000_0010
});
core.registerDidMethodNetwork({
  method: OPID_METHOD,
  blockchain: OPID_BLOCKCHAIN,
  chainId: OPID_CHAIN_ID_MAIN,
  network: OPID_NETWORK_MAIN,
  networkFlag: 0b1000_0000 | 0b0000_0001
});

const Operators = {
  NOOP: 0, // No operation, skip query verification in circuit
  EQ: 1, // equal
  LT: 2, // less than
  GT: 3, // greater than
  IN: 4, // in
  NIN: 5, // not in
  NE: 6 // not equal
};

function coreSchemaFromStr(schemaIntString) {
  const schemaInt = BigInt(schemaIntString);
  return SchemaHash.newSchemaHashFromInt(schemaInt);
}

async function buildZkpRequest(requestId: number, circuit: CircuitId) {
  const verifierId = buildVerifierId(VERIFIER_ADDRESS, {
    blockchain: 'optimism',
    networkId: 'sepolia',
    method: OPID_METHOD
  });

  const query: any = {
    requestId,
    schema: '74977327600848231385663280181476307657', // you can run https://go.dev/play/p/oB_oOW7kBEw to get schema hash and claimPathKey using YOUR schema
    claimPathKey: '20376033832371109177683048456014525905119173674985843915445634726167450989630', // merklized path to field in the W3C credential according to JSONLD  schema e.g. birthday in the KYCAgeCredential under the url "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld"
    operator: Operators.LT,
    slotIndex: 0,
    value: [20020101, ...new Array(63).fill(0)], // for operators 1-3 only first value matters
    circuitIds: [circuit],
    skipClaimRevocationCheck: false,
    claimPathNotExists: 0,
    verifierID: verifierId.bigInt().toString(),
    nullifierSessionID: 0,
    groupID: 0,
    proofType: 0
  };

  const merklized = 1;
  const schemaHash = coreSchemaFromStr(query.schema);
  query.queryHash = calculateQueryHashV3(
    query.value.map((i) => BigInt(i)),
    schemaHash,
    query.slotIndex,
    query.operator,
    query.claimPathKey,
    1, // valueArrSize
    merklized,
    query.skipClaimRevocationCheck ? 0 : 1,
    verifierId.bigInt().toString(),
    query.nullifierSessionID
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

    // Only UniversalVerifier requires whitelisting
    if (VERIFIER_CONTRACT === 'UniversalVerifier') {
      await verifier.addValidatorToWhitelist(VALIDATOR_ADDRESS_V3);
    }

    // set sig request
    const sigZkRequest = await buildZkpRequest(
      TRANSFER_REQUEST_ID_V3_VALIDATOR,
      CircuitId.AtomicQueryV3OnChain
    );
    const sigTx = await verifier.setZKPRequest(sigZkRequest.query.requestId, {
      metadata: JSON.stringify(sigZkRequest.invokeRequestMetadata),
      validator: VALIDATOR_ADDRESS_V3,
      data: packV3ValidatorParams(sigZkRequest.query)
    });
    await sigTx.wait();
    console.log('Sig zk request set', sigTx.hash);
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

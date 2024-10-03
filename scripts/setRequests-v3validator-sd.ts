import hre from 'hardhat';
import { SchemaHash } from '@iden3/js-iden3-core';
import { calculateQueryHashV3, CircuitId, core, OPID_METHOD } from '@wakeuplabs/opid-sdk';
import { buildVerifierId } from '../test/utils/utils';
import { packV3ValidatorParams } from '../test/utils/pack-utils';

// current smart contracts on opt-sepolia
const VERIFIER_CONTRACT = 'ERC20SelectiveDisclosureVerifier';
const VERIFIER_ADDRESS = '0x9001f41Fbe63fF09635Fe8Dfc532035BA34348B9'; // ERC20SelectiveDisclosureVerifier
const VALIDATOR_ADDRESS_V3 = '0xd52131eDC6777d7F7199663dc1629307E13d723A';

const TRANSFER_REQUEST_ID_V3_VALIDATOR = 3;

const OPID_BLOCKCHAIN = 'optimism';
const OPID_CHAIN_ID_SEPOLIA = 11155420;
const OPID_NETWORK_SEPOLIA = 'sepolia';

const Operators = {
  NOOP: 0, // No operation, skip query verification in circuit
  EQ: 1, // equal
  LT: 2, // less than
  GT: 3, // greater than
  IN: 4, // in
  NIN: 5, // not in
  NE: 6, // not equal
  SD: 16 // Selective disclosure
};

function coreSchemaFromStr(schemaIntString) {
  const schemaInt = BigInt(schemaIntString);
  return SchemaHash.newSchemaHashFromInt(schemaInt);
}

async function buildSdZkpRequest(requestId: number) {
  const verifierId = buildVerifierId(VERIFIER_ADDRESS, {
    blockchain: OPID_BLOCKCHAIN,
    networkId: OPID_NETWORK_SEPOLIA,
    method: OPID_METHOD
  });

  const query: any = {
    requestId,
    schema: '74977327600848231385663280181476307657', // you can run https://go.dev/play/p/3id7HAhf-Wi  to get schema hash and claimPathKey using YOUR schema
    claimPathKey: '20376033832371109177683048456014525905119173674985843915445634726167450989630', // merklized path to field in the W3C credential according to JSONLD  schema e.g. birthday in the KYCAgeCredential under the url "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld"
    operator: Operators.SD, //
    slotIndex: 0, // because schema  is merklized for merklized credential, otherwise you should actual put slot index  https://docs.iden3.io/protocol/non-merklized/#motivation
    value: [],
    circuitIds: [CircuitId.AtomicQueryV3OnChain],
    skipClaimRevocationCheck: false,
    claimPathNotExists: 0, // 0 for inclusion (merklized credentials) - 1 for non-merklized
    verifierID: verifierId.bigInt().toString(),
    nullifierSessionID: 0,
    groupID: 0,
    proofType: 1
  };

  const merklized = 1;
  const schemaHash = coreSchemaFromStr(query.schema);
  query.queryHash = calculateQueryHashV3(
    query.value.map((i) => BigInt(i)),
    schemaHash,
    query.slotIndex,
    query.operator,
    query.claimPathKey,
    0, // valueArrSize
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
    from: core.DID.parseFromId(verifierId).string(),
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
          proofType: 'BJJSignature2021',
          query: {
            allowedIssuers: ['*'],
            context:
              'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld',
            credentialSubject: {
              birthday: {}
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

    // set sig request
    const sigZkRequest = await buildSdZkpRequest(TRANSFER_REQUEST_ID_V3_VALIDATOR);
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

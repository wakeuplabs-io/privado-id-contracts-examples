import hre from 'hardhat';
import { SchemaHash } from '@iden3/js-iden3-core';
import {
  calculateQueryHashV2,
  calculateQueryHashV3,
  CircuitId,
  core,
  OPID_METHOD
} from '@wakeuplabs/opid-sdk';
import { buildVerifierId } from '../test/utils/utils';
import { packV2ValidatorParams, packV3ValidatorParams } from '../test/utils/pack-utils';

// network config
const OPID_BLOCKCHAIN = 'optimism';
const OPID_NETWORK_SEPOLIA = 'sepolia';
const OPID_CHAIN_ID_SEPOLIA = 11155420;

// current smart contracts on opt-sepolia
const VERIFIER_CONTRACT = '...' as string; // UniversalVerifier or ERC20Verifier but ERC20Verifier doesn't currently support V3 proofs submit
const VERIFIER_ADDRESS = '...'; // Universal Verifier or ERC20 Verifier but ERC20Verifier doesn't currently support V3 proofs submit
const SIGV2_VALIDATOR_ADDRESS = '0xbA308e870d35A092810a3F0e4d21ece65551dE42';
const MTP_VALIDATOR_ADDRESS = '0x6e009702a8b16Dca15Fa145E3906B13E75Dc516e';
const VALIDATOR_ADDRESS_V3 = '0xd52131eDC6777d7F7199663dc1629307E13d723A';

// request ids must match contracts
const TRANSFER_REQUEST_ID_SIG_VALIDATOR = 1;
const TRANSFER_REQUEST_ID_MTP_VALIDATOR = 2;
const TRANSFER_REQUEST_ID_V3_VALIDATOR = 3;
const TRANSFER_REQUEST_ID_V3_VALIDATOR_SD = 4;

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

// =================================================================================
// ============================== ZKP REQUEST BUILDERS =============================
// =================================================================================

async function buildZkpRequestV3() {
  const verifierId = buildVerifierId(VERIFIER_ADDRESS, {
    blockchain: 'optimism',
    networkId: 'sepolia',
    method: OPID_METHOD
  });

  const query: any = {
    requestId: TRANSFER_REQUEST_ID_V3_VALIDATOR,
    schema: '74977327600848231385663280181476307657', // you can run https://go.dev/play/p/oB_oOW7kBEw to get schema hash and claimPathKey using YOUR schema
    claimPathKey: '20376033832371109177683048456014525905119173674985843915445634726167450989630', // merklized path to field in the W3C credential according to JSONLD  schema e.g. birthday in the KYCAgeCredential under the url "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld"
    operator: Operators.LT,
    slotIndex: 0,
    value: [20020101, ...new Array(63).fill(0)], // for operators 1-3 only first value matters
    circuitIds: [CircuitId.AtomicQueryV3OnChain],
    skipClaimRevocationCheck: false,
    claimPathNotExists: 0,
    verifierID: verifierId.bigInt().toString(),
    nullifierSessionID: 0,
    groupID: 0,
    proofType: 0
  };

  const merklized = 1;
  const schemaHash = SchemaHash.newSchemaHashFromInt(BigInt(query.schema));
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
    id: TRANSFER_REQUEST_ID_V3_VALIDATOR,
    request: {
      metadata: JSON.stringify(invokeRequestMetadata),
      validator: VALIDATOR_ADDRESS_V3,
      data: packV3ValidatorParams(query)
    }
  };
}

async function buildZkpRequestSig() {
  const query: any = {
    requestId: TRANSFER_REQUEST_ID_SIG_VALIDATOR,
    schema: '74977327600848231385663280181476307657', // you can run https://go.dev/play/p/oB_oOW7kBEw to get schema hash and claimPathKey using YOUR schema
    claimPathKey: '20376033832371109177683048456014525905119173674985843915445634726167450989630', // merklized path to field in the W3C credential according to JSONLD  schema e.g. birthday in the KYCAgeCredential under the url "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld"
    operator: Operators.LT,
    slotIndex: 0,
    value: [20020101, ...new Array(63).fill(0)], // for operators 1-3 only first value matters
    circuitIds: [CircuitId.AtomicQuerySigV2OnChain],
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
    id: TRANSFER_REQUEST_ID_SIG_VALIDATOR,
    request: {
      metadata: JSON.stringify(invokeRequestMetadata),
      validator: SIGV2_VALIDATOR_ADDRESS,
      data: packV2ValidatorParams(query)
    }
  };
}

async function buildZkpRequestMtp() {
  const query: any = {
    requestId: TRANSFER_REQUEST_ID_MTP_VALIDATOR,
    schema: '74977327600848231385663280181476307657', // you can run https://go.dev/play/p/oB_oOW7kBEw to get schema hash and claimPathKey using YOUR schema
    claimPathKey: '20376033832371109177683048456014525905119173674985843915445634726167450989630', // merklized path to field in the W3C credential according to JSONLD  schema e.g. birthday in the KYCAgeCredential under the url "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld"
    operator: Operators.LT,
    slotIndex: 0,
    value: [20020101, ...new Array(63).fill(0)], // for operators 1-3 only first value matters
    circuitIds: [CircuitId.AtomicQueryMTPV2OnChain],
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
    id: TRANSFER_REQUEST_ID_MTP_VALIDATOR,
    request: {
      metadata: JSON.stringify(invokeRequestMetadata),
      validator: MTP_VALIDATOR_ADDRESS,
      data: packV2ValidatorParams(query)
    }
  };
}

async function buildZkpRequestV3SD() {
  const verifierId = buildVerifierId(VERIFIER_ADDRESS, {
    blockchain: OPID_BLOCKCHAIN,
    networkId: OPID_NETWORK_SEPOLIA,
    method: OPID_METHOD
  });

  const query: any = {
    requestId: TRANSFER_REQUEST_ID_V3_VALIDATOR_SD,
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
  const schemaHash = SchemaHash.newSchemaHashFromInt(BigInt(query.schema));
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
    id: TRANSFER_REQUEST_ID_V3_VALIDATOR_SD,
    request: {
      metadata: JSON.stringify(invokeRequestMetadata),
      validator: VALIDATOR_ADDRESS_V3,
      data: packV3ValidatorParams(query)
    }
  };
}

// =================================================================================
// ====================================== MAIN =====================================
// =================================================================================

async function main() {
  try {
    let request, tx;
    const verifier = await hre.ethers.getContractAt(VERIFIER_CONTRACT, VERIFIER_ADDRESS);

    // Only UniversalVerifier requires whitelisting
    if (VERIFIER_CONTRACT === 'UniversalVerifier') {
      await verifier.addValidatorToWhitelist(VALIDATOR_ADDRESS_V3);
    }

    // set sig request
    request = await buildZkpRequestSig();
    tx = await verifier.setZKPRequest(request.id, request.request);
    await tx.wait();
    console.log('Sig request set', tx.hash);

    // set mtp request
    request = await buildZkpRequestMtp();
    tx = await verifier.setZKPRequest(request.id, request.request);
    await tx.wait();
    console.log('MTP request set', tx.hash);

    // set v3 request
    request = await buildZkpRequestV3();
    tx = await verifier.setZKPRequest(request.id, request.request);
    await tx.wait();
    console.log('V3 request set', tx.hash);

    // set v3 Selective disclosure request
    request = await buildZkpRequestV3SD();
    tx = await verifier.setZKPRequest(request.id, request.request);
    await tx.wait();
    console.log('V3 SD request set', tx.hash);
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

# Contracts

This repository contains examples of smart contracts and deployment scripts.

## State Contract

|        Network             |     Address                                |
|:--------------------------:|:------------------------------------------:|
| **Optimism Mainnet** | TODO: |
| **Optimism Sepolia** | 0x9a1A258702050BcFB938Ad8Ec0996503473216d1 |

## IdentityTreeStore contract (On-chain RHS)

|        Network             |     Address                                |
|:--------------------------:|:------------------------------------------:|
| **Optimism Mainnet** | TODO: |
| **Optimism Sepolia** | 0xa36D2Ed3Dd32B96979D94Ea4cb541059A2029484 |

## UniversalVerifier contract

|         Network          |                  Address                   |
| :----------------------: | :----------------------------------------: |
|   **Optimism Mainnet** | TODO: |
| **Optimism sepolia** | 0xf88552AEe625c290505036Da15FfCfC459BA41cA |

## ERC20 example, Validators & Verifiers contracts

If you are deploying your own ZKPVerifier, you can use already deployed Circuit Validators with the corresponding Verifiers.

The example of ERC20 smart contract. This example shows how to use sig/mtp validator to verification zero-knowledge proof on-chain.

We aim to provide deployment of:

- Atomic query MTP validator https://github.com/iden3/contracts/blob/master/contracts/validators/CredentialAtomicQueryMTPValidator.sol
- Atomic query Signature validator https://github.com/iden3/contracts/blob/master/contracts/validators/CredentialAtomicQuerySigValidator.sol
- Example contract that inherits ZKP Verifier contract https://github.com/iden3/contracts/blob/master/contracts/verifiers/ZKPVerifier.sol

Also, it contains the example of ERC20 based smart contract with enabled zkp verifications for token transfers.

<details>
<summary>Addresses</summary>

Current addresses on **Optimism Mainnet** (V3 Validators):

|                   |                             Sig                             |                             MTP                              |
|:-----------------:|:-----------------------------------------------------------:|:------------------------------------------------------------:|
| **Verifier** | TODO: | TODO: |
| **Validators** | TODO: | TODO: |
| **ERC20 example** | TODO: (request id = 1) | TODO:  (request id = 2) |


Current addresses on **Optimism Sepolia** (V3 validators)

|                   |                             Sig                             |                             MTP                              |
|:-----------------:|:-----------------------------------------------------------:|:------------------------------------------------------------:|
| **Verifier** | TODO: | TODO: |
| **Validators** | TODO: | TODO: |
| **ERC20 example** | TODO: (request id = 1) | TODO:  (request id = 2) |

</details>

## BalanceCredentialIssuer (v1.0.0)

Here is an example of a **non-merklized** on-chain issuer. This example demonstrates how to use the IdentityBase library to create your own on-chain issuer implementation.

<details>
<summary>Addresses</summary>

**Optimism Mainnet**:

|                             |                    Address                     |
|:---------------------------:|:------------------------------------------:|
|    Poseidon2Elements    | TODO: |
|    Poseidon3Elements    | TODO: |
|    Poseidon4Elements    | TODO: |
|         SmtLib          | TODO: |
|      ClaimBuilder       | TODO: |
|       IdentityLib       | TODO: |
| **BalanceCredentialIssuer** | TODO: |

**Optimism Sepolia**:

|                             |                    Address                     |
|:---------------------------:|:------------------------------------------:|
|    Poseidon2Elements    | TODO: |
|    Poseidon3Elements    | TODO: |
|    Poseidon4Elements    | TODO: |
|         SmtLib          | TODO: |
|      ClaimBuilder       | TODO: |
|       IdentityLib       | TODO: |
| **BalanceCredentialIssuer** | TODO: |


</details>


## IdentityExample

Here is an example of a **merklized** on-chain issuer. This example demonstrates how to use the IdentityBase library to create your own on-chain issuer implementation. There is no deployed contracts since each user is required to deploy the contract independently. Only the contract owner has the authority to issue a claim.

<details>
<summary>Addresses</summary>

Optimism sepolia:

|                       |                    Address                     |
|:---------------------:|:------------------------------------------:|
| **Poseidon2Elements** | TODO: |
| **Poseidon3Elements** | TODO: |
| **Poseidon4Elements** | TODO: |
|      **SmtLib**       | TODO: |
| **Identity Contract** | TODO: |

</details>


## Deploy scripts

1. **deploy:mumbai:erc20** - deploy erc20 smart contract to polygon mumbai
1. **deploy:mumbai:sig** - deploy signature validator to polygon mumbai
1. **deploy:mumbai:mtp** - deploy MTP validator to polygon mumbai
1. **deploy:main:erc20** - deploy erc20 smart contract to polygon mainnet
1. **deploy:main:sig** - deploy signature validator to polygon mainnet
1. **deploy:main:mtp** - deploy MTP validator to polygon mainnet

1. **deploy:mumbai:identityexample** - deploy onchain merklized issuer example to polygon mumbai
1. **deploy:amoy:identityexample** - deploy onchain merklized issuer example to polygon amoy
1. **deploy:main:identityexample** - deploy onchain merklized issuer example to polygon mainnet

1. **deploy:mumbai:balancecredentialissuer** - deploy onchain non-merklized issuer example to polygon mumbai
1. **deploy:amoy:balancecredentialissuer** - deploy onchain non-merklized issuer example to polygon amoy
1. **deploy:main:balancecredentialissuer** - deploy onchain non-merklized issuer example to polygon mainnet

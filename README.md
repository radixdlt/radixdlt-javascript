[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/radixdlt/radixdlt-javascript/blob/main/LICENSE)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

# radixdlt-javascript

(Actually `radixdlt-typescript` 😉) A client library for interacting with the Radix DLT public network.

# Status

- [x] Setup `lerna` and `yarn workspaces`.  
- [x] Create placeholder packages and create table of them.  
- [x] Create API (code example) of `RadixApplicationClient`.  
- [x] Create a cross package tsconfig "inheritance" solution, using a shared tsconfig [like Zilliqa's `tsconfig.base.json`](https://github.com/Zilliqa/Zilliqa-JavaScript-Library/blob/dev/tsconfig.base.json) which Zilliqa then ["extends" in each individual package](https://github.com/Zilliqa/Zilliqa-JavaScript-Library/blob/dev/packages/zilliqa-js-blockchain/tsconfig.json#L2) using the tsconfig value [`extends`](https://www.typescriptlang.org/tsconfig#extends).  
- [X] Setup code **linting** config for [`typescript-eslint`](https://github.com/typescript-eslint) (`tslint.json`).  
- [x] Setup [`jest`][jest] testing framework + shared tsconfig test config [like Zilliqa is doing](https://github.com/Zilliqa/Zilliqa-JavaScript-Library/blob/dev/packages/zilliqa-js-blockchain/tsconfig.test.json#L2).
- [x] Setup code **formating** using [`prettier`](https://prettier.io/)

# Development

This repository makes use of several technologies to provide a better and faster development experience for contributors. It has to be bootstrapped before you can do productive work.

## Bootstrapping

`radixdlt-javascript` leverages [Project References](https://www.typescriptlang.org/docs/handbook/project-references.html), which is available in TypeScript from version `3.0`, thus the build process is slightly different.

```zsh
# install all dependencies and shared devDependencies
yarn install

# symlink packages, compile TS source files
yarn bootstrap

# watch TS source files and recompile on change
yarn build:ts -w
```

## IDE Support

### VSCode

To make VSCode format the files according to our linting rules, add the [_Prettier ESLint_ plugin by Rebecca Vest](https://marketplace.visualstudio.com/items?itemName=rvest.vs-code-prettier-eslint).


# Packages

This git repository is a so called "monorepo" using [`yarn` *workspaces*](https://classic.yarnpkg.com/en/docs/workspaces/) and [*lerna*](https://github.com/lerna/lerna) **together**,

| Package | Description | Key Components | Internal Dependency | Notable external dependency |
| --- | --- | --- | --- | --- |
| [`@radix/application`][app] | High level abstraction for interacting with the Radix Distributed Ledger | `RadixApplicationClient` | [`@radix/chemistry`][chem], [`@radix/crypto`][crypto] | None |
||
| [`@radix/hardware-wallet`][hwLedger] | Ledger Nano hardware wallet application. | `HWWalletLedger` | [`@radix/atom`][atom] | [`LedgerHQ/ledgerjs`](https://github.com/LedgerHQ/ledgerjs) |
||
| [`@radix/networking`][networking] | Sending and receiving of atoms over network transportation. | `AtomPuller`, `AtomSender`, `WebsocketToNode` | [`@radix/atom`][atom] | None |
||
| [`@radix/chemistry`][chem] | Creating Atoms from `Transaction` | `AtomToTransactionMapper`, `TransactionToAtomMapper` | [`@radix/atom`][atom], [`@radix/actions`][actions] | None |
||
| [`@radix/actions`][actions] | High level abstractions user initiated actions. | `TokenTransferAction`, `SendMessageAction` | [`@radix/primitives`][subatom] | None |
||
| [`@radix/atom`][atom] | Implementation of [Radix *Atom Model*](https://dev.to/radixdlt/knowledgebase-update-atom-model-263i), a container for [CRUD instructions](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) sent to the Radix distributed ledger. | `Atom`, `Particle`, `ParticleGroup`, `Spin` | [`@radix/primitives`][subatom], [`@radix/dson`][dson] | None |
||
| [`@radix/crypto`][crypto] | Toolchain of cryptographic primitives such as SHA256 digests, [ECIES encryption](https://en.wikipedia.org/wiki/Integrated_Encryption_Scheme) and [ECC methods](https://en.wikipedia.org/wiki/Elliptic-curve_cryptography) (KeyGen, Sign, Verify) | `PrivateKey`, `PublicKey`, `KeyPair`, `Hasher`, `Signer` | [`@radix/primitives`][subatom] | [indutny/elliptic](https://github.com/indutny/elliptic) |
||
| [`@radix/primitives`][subatom] | Shared common data types | `Base58`, `UInt256`, `Int64`, `Nonce` | No dependencies | None |
||
| [`@radix/dson`][dson] | The binary data format [**CBOR**](https://cbor.io/) (de-)serialization (+Radix own *DSON*) | `DSONSerializable` | No dependencies | [`cbor`](https://www.npmjs.com/package/cbor) |


# API for [`@radix/application`][app]

**Create `RadixApplicationClient`**

```typescript
// The way of interacting with the Radix decentralized ledger / public network is through the `RadixApplicationClient`
const radixClient = new RadixApplicationClient()

// Cannot get radix address if not connected to a node
await radixClient.myAddress() // Error not connected to any node

// Connecting to node either via IP or via our centralized NodeFinder API.
await radixClient.connectToNode(new TrustedNode('333.444.555.666'))

// Cannot get my address since we have no public key yet.
await radixClient.myAddress() // Error no publicKey present
```

**Resolve `publicKey` and `RadixAddress`**

```typescript
// Initiate Hardware wallet 
const hardwareWalletLedger = new HardwareWalletLedger(LedgerNanoCommunicationProtocol.HID)

// Wait for wallet to be connected for the Radix Ledger App to be opened
await hardwareWalletLedger.connect()

// Interface for retrieving a public key at some derivation path (BIP44 path)
const publicKeyProvider = hardwareWalletLedger.publicKeyProvider()

// Add public key provider to `radixClient`
radixClient.resolvePublicKeyUsing(publicKeyProvider)

// Prepare derivation path for Ledger 
const accountIndex0 = new BIP44Path("m/44'/0/0'/0'")

// Resolve public key using ledger device, needs to wait for physical input from user on Ledger Nano
const publicKey = await publicKeyProvider.resolve(accountIndex0) 

// Assert that `radixClient` instance has its active `publicKey` set
assert(publicKey === radixClient.publicKey) // OK!

// Finally able to get our address
const address = await radixClient.myAddress() // OK! We're connected to a node so we have 'magic' from universe config from node and public key

// The address contains the public key `publicKey` derived from the Ledger
assert(address.publicKey === publicKey)
```

**Create and sign transfer of XRD tokens to Bob**

```typescript
// Generate some new address, dependent on 'magic', so dependent on which node we are connected to.
const bob = await radixClient.addressFromPublicKey(new PublicKey(PrivateKey.generateNew())) 

// RadixClient retrieved some genesis information about native token from the node it is connected to.
const xrdTokenDefinition = radixClient.nativeTokenDefinition()

// XRD is the symbol for our native token
assert(xrdTokenDefinition.identifier === '/JH1P8f3znbyrDj8F4RWpix7hRkgxqHjdW2fNnKpR3v6ufXnknor/XRD')

// Transfer tokens to Bob, wait for transaction to complete
const tokenTransferTransaction = await radixClient.execute({
  tokenTransfer: ({
    to: bob,
    amount: 1337,
    identifier: xrdTokenDefinition.identifier
  }),

  // Have to wait for UI wallet to send atom to Ledger wallet and for user to review & accept tokenTransfer on device
  signer: await hardwareWalletLedger.sign(accountIndex0)
})
```

**Inspect contents of `tokenTransferTransaction`**

```typescript

// A `Transaction` is a container for one or many user actions (for a set of well known particles)
assert(tokenTransferTransaction.userActions.length === 1)

// The only user action is the transfer of tokens
const tokenTransferAction = tokenTransferTransaction.userActions[0]

// Type should be `TokenTransferAction`
assert(tokenTransferAction instanceof TokenTransferAction)

// The sender of the tokenTransfer will be the active address of `radixClient` at the time of call to `transferTokens` function
assert(tokenTransferAction.sender === address)
assert(tokenTransferAction.recipient === bob)

// The `Transaction` also contains the "raw" atom.
const tokenTransferAtom = tokenTransferTransaction.atom

// Can inspect e.g. particleGroups of the atom.
assert(tokenTransferAtom.particleGroups.length === 2) // ParticleGroup at index 0 is actual transfer, index 1 is token fee 
```


<!-- LINKS -->

<!-- Radix packages links -->
[app]: ./packages/application
[dson]: ./packages/dson
[chem]: ./packages/chemistry
[atom]: ./packages/atom
[crypto]: ./packages/crypto
[subatom]: ./packages/primitives
[networking]: ./packages/networking
[hwLedger]: ./packages/hardware-wallet
[actions]: ./packages/actions

<!-- Third party links -->
[jest]: https://jestjs.io/
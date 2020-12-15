[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/radixdlt/radixdlt-javascript/blob/main/LICENSE)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

# radixdlt-javascript

(Actually `radixdlt-typescript` 😉) A client library for interacting with the Radix DLT public network.

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
| [`@radix/actions`][actions] | High level abstractions user initiated actions. | `TokenTransferAction`, `SendMessageAction` | [`@radix/subatomic`][subatom] | None |
||
| [`@radix/atom`][atom] | Implementation of [Radix *Atom Model*](https://dev.to/radixdlt/knowledgebase-update-atom-model-263i), a container for [CRUD instructions](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) sent to the Radix distributed ledger. | `Atom`, `Particle`, `ParticleGroup`, `Spin` | [`@radix/dson`][dson] | None |
||
| [`@radix/dson`][dson] | The binary data format [**CBOR**](https://cbor.io/) (de-)serialization (+Radix own *DSON*) | `DSONSerializable` | No dependencies | [`cbor`](https://www.npmjs.com/package/cbor) |
||
| [`@radix/crypto`][crypto] | Toolchain of cryptographic primitives such as SHA256 digests, [ECIES encryption](https://en.wikipedia.org/wiki/Integrated_Encryption_Scheme) and [ECC methods](https://en.wikipedia.org/wiki/Elliptic-curve_cryptography) (KeyGen, Sign, Verify) | `PrivateKey`, `PublicKey`, `KeyPair`, `Hasher`, `Signer` | [`@radix/subatomic`][subatom] | [indutny/elliptic](https://github.com/indutny/elliptic) |
||
| [`@radix/subatomic`][subatom] | Shared common data types | `Base58`, `UInt256`, `Int64`, `Nonce` | No dependencies | None |


# API for [`@radix/application`][app]

```typescript
// The way of interacting with the Radix decentralized ledger / public network is through the `RadixApplicationClient`
const radixClient = new RadixApplicationClient()

// Cannot get radix address if not connected to a node
await radixClient.myAddress() // Error not connected to any node

// Connecting to node either via IP or via our centralized NodeFinder API.
await radixClient.connectToNode(new TrustedNode('333.444.555.666'))

// Cannot get my address since we have no public key yet.
await radixClient.myAddress() // Error no publicKey present

// Initiate Hardware wallet 
const hardwareWalletLedger = new HardwareWalletLedger(LedgerNanoCommunicationProtocol.HID)

// Wait for wallet to be connected for the Radix Ledger App to be opened
await hardwareWalletLedger.connect()

// Interface for retrieving a public key at some derivation path (BIP44 path)
const publicKeyProvider = hardwareWalletLedger.publicKeyProvider()

// Add public key provider to `radixClient`
radixClient.resolvePublicKeyUsing(publicKeyProvider)

// Prepare derivation path for Ledger 
const bip44Path = new BIP44Path("m/44'/0/0'/0'")

// Resolve public key using ledger device, needs to wait for physical input from user on Ledger Nano
const publicKey = await publicKeyProvider.resolve(bip44Path) 

// Assert that `radixClient` instance has its active `publicKey` set
assert(publicKey === radixClient.publicKey) // OK!

// Finally able to get our address
const address = await radixClient.myAddress() // OK! We're connected to a node so we have 'magic' from universe config from node and public key

// The address contains the public key `publicKey` derived from the Ledger
assert(address.publicKey === publicKey)

// Generate some new address, dependent on 'magic', so dependent on which node we are connected to.
const bob = await radixClient.addressFromPublicKey(new PublicKey(PrivateKey.generateNew())) 

// RadixClient retrieved some genesis information about native token from the node it is connected to.
const xrdTokenDefinition = radixClient.nativeTokenDefinition()

// XRD is the symbol for our native token
assert(xrdTokenDefinition.identifier === '/JH1P8f3znbyrDj8F4RWpix7hRkgxqHjdW2fNnKpR3v6ufXnknor/XRD')

// Transfer tokens to Bob, wait for transaction to complete
const tokenTransferTransaction = await radixClient.transferTokens({
	to: bob,
	amount: 1337,
	identifier: xrdTokenDefinition.identifier
})

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
[app]: ./packages/radix-application
[dson]: ./packages/radix-dson
[chem]: ./packages/radix-chemistry
[atom]: ./packages/radix-atom
[crypto]: ./packages/radix-crypto
[subatom]: ./packages/radix-subatomic
[networking]: ./packages/radix-networking
[hwLedger]: ./packages/radix-hardware-wallet
[actions]: ./packages/radix-actions

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/radixdlt/radixdlt-javascript/blob/main/LICENSE)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

# radixdlt-javascript

(Actually `radixdlt-typescript` 😉) A client library for interacting with the Radix DLT public network.

```typescript
import { Radix } from '@radixdlt/application'

const radix = Radix.create()
	.login('my strong password', loadKeystore)
	.connect(new URL('https://api.radixdlt.com'))
	.tokenBalances
	.subscribe((tb) => console.log(`💎 My token balances ${tb.toString()}`)
```


# Development

This repository makes use of several technologies to provide a better and faster development experience for contributors. It has to be bootstrapped before you can do productive work.

## Bootstrapping

`radixdlt-javascript` leverages [Project References](https://www.typescriptlang.org/docs/handbook/project-references.html), which is available in TypeScript from version `3.0`, thus the build process is slightly different.

```zsh
# install all dependencies and shared devDependencies
yarn install

# symlink packages, compile TS source files
yarn setup-dev

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
| [`@radixdlt/application`][app] | High level abstraction for interacting with the Radix Distributed Ledger | `RadixT` | [`@radix/crypto`][crypto] | NONE |
||
| [`@radixdlt/hardware-wallet`][hwLedger] | Ledger Nano hardware wallet application. | `HWWalletLedger` | [`@radixdlt/atom`][atom] | [`LedgerHQ/ledgerjs`](https://github.com/LedgerHQ/ledgerjs) |
||
| [`@radixdlt/networking`][networking] | Sending and receiving of atoms over network transportation. | `AtomPuller`, `AtomSender`, `WebsocketToNode` | [`@radixdlt/atom`][atom] | NONE |
||
| [`@radixdlt/actions`][actions] | High level abstractions user initiated actions. | `TokenTransferAction`, `SendMessageAction` | [`@radixdlt/primitives`][primitives] | NONE |
||
| [`@radixdlt/atom`][atom] | Implementation of [Radix *Atom Model*](https://dev.to/radixdlt/knowledgebase-update-atom-model-263i), a container for [CRUD instructions](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) sent to the Radix distributed ledger. | `Atom`, `Particle`, `ParticleGroup`, `Spin` | [`@radixdlt/primitives`][primitives], [`@radix/data-formats`][dataformats] | NONE |
||
| [`@radixdlt/account`][account] | User account related APIs | `FOO` | [`@radixdlt/primitives`][primitives], [`@radixdlt/primitives`][crypto] | NONE |
||
| [`@radixdlt/crypto`][crypto] | Toolchain of cryptographic primitives such as SHA256 digests, [ECIES encryption](https://en.wikipedia.org/wiki/Integrated_Encryption_Scheme) and [ECC methods](https://en.wikipedia.org/wiki/Elliptic-curve_cryptography) (KeyGen, Sign, Verify) | `PrivateKey`, `PublicKey`, `KeyPair`, `Hasher`, `Signer` | [`@radixdlt/util`][util], [`@radixdlt/primitives`][primitives] | [indutny/elliptic](https://github.com/indutny/elliptic) |
||
| [`@radixdlt/primitives`][primitives] | Shared common data types | `Base58`, `UInt256`, `Int64`, `Nonce` | [`@radixdlt/util`][util], [`@radixdlt/data-formats`][dataformats] | [uint256](https://github.com/radixdlt/uint256) |
||
| [`@radixdlt/data-formats`][dataformats] | The binary data format [**CBOR**](https://cbor.io/) (de-)serialization (+Radix own *DSON*) | `DSONSerializable` | No dependencies | [`cbor`](https://www.npmjs.com/package/cbor) |
||
| [`@radixdlt/util`][util] | Common shared utility functions | `SecureRandom` | No dependencies | [`sodium-native`](https://www.npmjs.com/package/sodium-native), [`randombytes`](https://www.npmjs.com/package/randombytes) |


<!-- LINKS -->

<!-- Radix packages links -->
[app]: ./packages/application
[account]: ./packages/account
[dataformats]: ./packages/data-formats
[atom]: ./packages/atom
[crypto]: ./packages/crypto
[primitives]: ./packages/primitives
[networking]: ./packages/networking
[hwLedger]: ./packages/hardware-wallet
[actions]: ./packages/actions
[util]: ./packages/util

<!-- Third party links -->
[jest]: https://jestjs.io/


# API outline

Please see the [README of `@radixdlt/application`](packages/application/README) for a detail documentation.

Please see the [README of `@radixdlt/accounts`](packages/accounts/README) for info about setup of wallet.
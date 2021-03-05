[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/radixdlt/radixdlt-javascript/blob/main/LICENSE)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

# radixdlt-javascript

(Actually `radixdlt-typescript` 😉) A client library for interacting with the Radix DLT public network.

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
| [`@radixdlt/application`][app] | High level abstraction for interacting with the Radix Distributed Ledger | `RadixApplicationClient` | [`@radixdlt/atom-transaction-mapping`][atom-transaction-mapping], [`@radix/crypto`][crypto] | NONE |
||
| [`@radixdlt/hardware-wallet`][hwLedger] | Ledger Nano hardware wallet application. | `HWWalletLedger` | [`@radixdlt/atom`][atom] | [`LedgerHQ/ledgerjs`](https://github.com/LedgerHQ/ledgerjs) |
||
| [`@radixdlt/networking`][networking] | Sending and receiving of atoms over network transportation. | `AtomPuller`, `AtomSender`, `WebsocketToNode` | [`@radixdlt/atom`][atom] | NONE |
||
| [`@radixdlt/atom-transaction-mapping`][atom-transaction-mapping] | Creating Atoms from `Transaction` | `AtomToTransactionMapper`, `TransactionToAtomMapper` | [`@radixdlt/atom`][atom], [`@radix/actions`][actions] | NONE |
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
[atom-transaction-mapping]: ./packages/atom-transaction-mapping
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

## ☣️ WORK IN PROGRESS ☣️
This is NOT YET PEER REVIEWED very very very much work in progress. Will change! But should give some kind of clue as to how to interact with this library.

## Wallet

We have a `WalletT` type being a **hierchal deterministic wallet** (explained by [Ledger Acadamy](https://www.ledger.com/academy/crypto/what-are-hierarchical-deterministic-hd-wallets) and on [BitcoinWiki](https://en.bitcoinwiki.org/wiki/Deterministic_wallet#HD_Wallet_.E2.80.93_Hierarchical_Deterministic_Wallet)) capable of deriving all "account"s you will need. Accounts in quoutes since it is really just a keypair and a [BIP44 path](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki) (recipie on how it was derived).

The trailing _T_ in `WalletT` is a suffix we use for all `type`s (we don't use [TypeScript `class`es](https://www.typescriptlang.org/docs/handbook/classes.html) at all). We reserve the `Wallet` name as a "namespaces" for our types, providing static-like factory/constructor methods, e.g. `Wallet.create` (N.B. the **lack of** trailing _T_). This decision was taken since we believe you will more often _use the namespace_ `Wallet.create` than you have to _declare the type_ `WalletT`. 

Here follows the generation of a new mnemonic, derivation of HD master seed and encryption of it, yielding a keystore file, and the creation of wallet.

```typescript
import { Mnemonic, Strength, Language } from '@radixdlt/account'

const mnemonic = Mnemomic.generateNew({ 
	strength: Strength.WORD_COUNT_24, // OPTIONAL, defaults to 24 words
	language: Language.ENGLISH // OPTIONAL, defaults to English 
})

// This is NOT the application password (1️⃣)
const bip39Passphrase = 'qwertyuiop'

// ⚠️ Require user to backup mnemonic and passphrase. She will NEVER be able to re-view it.
const hdMasterSeed = HDMasterSeed.fromMnemonic({
	mnemonic: mnemonic,
	passphrase: bip39Passphrase // OPTIONAL
})

// This will be our "application password" (2️⃣)
const keystoreEncryptionPassword = 'my super strong randomly generated probably over 50 chars long encryption password'

const keystore = Keystore.encryptingHDMasterSeed({
	hdMasterSeed: hdMasterSeed,
	password: keystoreEncryptionPassword  // REQUIRED
})

// ⚠️ If user failed to back-up mnemonic and forgets `keystoreEncryptionPassword` she will NOT be able to recover her funds.

const wallet = Wallet.create({ 
	keystore: keystore,
	// HD path (BIP44): `m/44'/536'/0'/0/0`
	startAt: { // OPTIONAL, defaults to { index: 0, hardened: false }
		addressIndex: 0,
		hardened: false,
	}
})
```

1️⃣: The `bip39Passphrase` provides an additional "word" (not a necessarily a word) to the Mnemonic words for more info please read [this section in BIP-39 doc](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki#from-mnemonic-to-seed).

2️⃣ The `keystoreEncryptionPassword` will be needed everytime the user re-opens the wallet app after having terminated it. It's used to _decrypt_ the encrypted `hdMasterSeed`. Remember, the keystore is just a JSON file containing an encrypted ciphertext, and metadata about the encrypted used to derive said cihpertext. The ciphertext itself is the BIP39 "seed", not the entropy/mnemonic itself. The raw entropy and the mnemonic words/phrase is the very same thing! The mnemonic is just a easy-to-remember-mapping from bits to words! The seed, however, is a hashing of the entropy, so we can _**N E V E R**_ recover the mnemonic(=entropy) from the seed. Storing the seed (encrypted, of course!) should be consider just very slightly more safe then storing the entropy. But if attacker gets access of the seed, it is game over anyway, because the seed can be used to recover every singly account the user has.

## Observe address

```typescript
import { Subscription } from 'rxjs'

const radix = Radix.create({
	wallet: wallet, // OPTIONAL, can be added later
	node: "https://radixdlt.api.com" // OPTIONAL, can be added later
})

// Address retrival is async, since we must make network request to
// node API and ask for a network identifier called "universe magic",
// that is prefixed to all our addresses. We use RxJS since we want
// "streams" of events, when user changes active account in wallet
// this observable stream will emit the new address for the new account.
const address$: Observable<Address> = radix.observeMyAddress()
// 💡 Trailing `$` for `Observable` variables (3️⃣)

const subs = new Subscription()

address$
	.subscribe((address) => console.log(`🙋🏽‍♀️ My address is: ${address.toString()}`))
	.add(subs)

// '🙋🏽‍♀️ My address is: 9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT'

radix.wallet.deriveNext()
// '🙋🏽‍♀️ My address is: 9S8PWQF9smUics1sZEo7CrYgKgCkcopvt9HfWJMTrtPyV2rg7RAG'

radix.wallet.deriveNext()
// '🙋🏽‍♀️ My address is: 9SAihkYQDBKvHfhvwEw4QBfx1rpjvta2TvmWibyXixVzX2JHHHWf'

radix.wallet.changeAccount(to: AccountIndex.FIRST)
// '🙋🏽‍♀️ My address is: 9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT'
```

3️⃣ The notation of using trailing `$` for `Observable` variables is documented by [Cycle.js](https://cycle.js.org/) and [Angular](https://angular.io/guide/rx-library#naming-conventions-for-observables)

## Observe Accounts

In the code snippet above we called `radix.wallet.deriveNext()` twice, including the initial account we should now be able to list (print with `console.log`) our three accounts.

```typescript
const accounts$: Observable<Accounts> = radix.observeAccounts()

accounts$
	.subscribe((aList) => console.log('📕 my accounts: ${aList.toString()}'))
	.add(subs)
// `📕 my accounts: [
// 	{
//		address: '9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
//		bip44Path: "m/44'/536'/0'/0/0",
//	},
// 	{
//		address: '9S8PWQF9smUics1sZEo7CrYgKgCkcopvt9HfWJMTrtPyV2rg7RAG',
//		bip44Path: "m/44'/536'/0'/0/1",
//	},
// 	{
//		address: '9SAihkYQDBKvHfhvwEw4QBfx1rpjvta2TvmWibyXixVzX2JHHHWf',
//		bip44Path: "m/44'/536'/0'/0/2",
//	},
// ]`
```

## Token Balances

The Radix ledger has support for multiple assets ("coins" or "tokens"). Their's one special token though, the "native token" of the Radix ecosystem, the "Rad" with ticker/symbol `"XRD"`.

Each token is uniquely identified by an identifier (type: `ResourceIdentifierT`), being a string looking like this: `'/9SAusiPSyX8xJ3gbNJyYUHZaWz1jSYxXoBnWbzMAkcjhug6G3nLd/XRD'`. Keen eyes will notice the separator `/` between an address and the symbol. The address is the address of the owner of the token.

Apart from observing all token balances you can also query the Radix ledger for information about the native token, the returned type is `TokenT`.

```typescript
const nativeToken$: Observable<TokenT> = radix.observeNativeToken()

nativeToken$
	.subscribe((xrd) => console.log(`💎 XRD: ${xrd.toString()}`))
	.add(subs)

// `💎 XRD: {
//		symbol: 'XRD',
//		name: 'Rad',
//		description: 'The native token of the Radix network',
// 		granularity: '100000000000000',
//		supply: '44000000000000000000000000000',
//		url: 'https://radixdlt.com',
//		iconURL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7692.png',
//	}`
```

Let's fetch our token balances! And also using the identifier of the native token let's use [RxJS `combineLatest`](https://rxjs-dev.firebaseapp.com/api/index/function/combineLatest) to get just the XRD balance.

```typescript
// Let's say user shares her address to a friend that transfers some XRD tokens to her.

const tokenBalances$: Observable<TokenBalances> = radix.observeTokenBalances()

tokenBalances$
	.subscribe((tokenBalances) => console.log(`💰 token balances: ${tokenBalances.toString()}`))
	.add(subs)

// '💰 token balances: [XRD: 1234.5, BTC: 0.012]'



import { combineLatest } from 'rxjs'

const nativeTokenBalance$: Observable<TokenBalance> = combineLatest(
	tokenBalances$, 
	nativeToken$
).pipe(	
	map((tokenBalances, nativeToken) => tokenBalances.balanceOf(nativeToken.identifier)),
)

nativeTokenBalance$
	.subscribe((bal) => console.log(`💵 ${bal.token.symbol} balance: ${bal.amount.toString()}`))
	.add(subs)
// '💵 XRD balance: 1234.5'
```

## Observe transactions

```typescript
// 💡 A `Transaction` is NOT the same thing as the transfer of tokens. A transaction
// it is synonymous with the term "database transaction", an atomic write operation 
// against the Radix ledger. It consists of a list of `UserActions`, token Fee and
// an optional (encrypted) message. Where `TransferTokensAction` is one example of
// a `UserAction`, another one being `StakeTokensAction` or `ClaimEmissionAction`.
const transactions$: Observable<Transactions> = radix.observeTransactions()

transactions$
	.subscribe((txList) => console.log(`📒 transactions: ${txList.toString()}`))
	.add(subs)
// `📒 transactions: [
//	{ 
//		incoming: true,
//		actions: [
//			tokenTransfer(
//				from: '9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
//				to: '9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT'
//				amount: 1235.5, 
//				tokenIdentifier: '/9SAusiPSyX8xJ3gbNJyYUHZaWz1jSYxXoBnWbzMAkcjhug6G3nLd/XRD'
//			)
//		], 
//		message: 'ee5c74e22e6f37a041c057920320a2fab2a78c18ea875c9699000a56bba4409da4ad617c41629be6ee30ccf6971117593f9091b54c4b7a782fc5a9cb768bcabb38c637ea20ae6efd9d7f60161f162cfe48e79e1db3cb3c802521e1bdea2be134ad0938ec52ec218a794e38b8f29620ff7e031e016eece8c477e14a6ccc188809e35023d07dd663fedff837'
//		date: '2021-03-05', 
//		txID: '9b3ff63d7a055e037f0d52b0e6382e07388927a66b2cc97c56abab3870585f04' 
//	}
//	]`
```

## Transfer tokens

Finally lets send some tokens ourselves!

```typescript
// Later when user has received funds (when `nativeTokenBalance$` have emitted token balances, and GUI Wallet has updated)
// Now user would like to send some tokens to her friend Bob's address.

// 💡 `TransactionTracking` is a type containing the newly broadcasted `Transaction` together with
// a `status$: Observable<TransactionStatus>`, you can use to keep track of status of the transaction,
const transactionTracking: TransactionTracking = radix.transferNativeTokens({
	to: '9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
	amount: 42,
})

transactionTracking.status$
	.pipe(
		.skipUntil((txStatus) => txStatus === TransactionStatus.CONFIRMED || txStatus === TransactionStatus.FAILED),
		.map((_) => transactionTracking.transaction)
	)
	.subscribe(
		(tx) => console.log(`✅ tx confirmed: ${tx.toString()}`)),
		(error) => console.log(`☢️ tx failed: ${error.toString()}`))
	)
	.add(subs)


transactionTracking.status$
	.subscribe((txStatus) => console.log(`📡 tx status: ${txStatus}`))
	.add(subs)

	
// `📡 tx status: 'dispatched'`
// `📡 tx status: 'pending'`
// `✅ tx confirmed: {
//		txId: '388927a66b2cc97c56abab3870585f049b3ff63d7a055e037f0d52b0e6382e07',
//		tokenFee: 0.094,
//		sentAt: '2021-03-05 15:57:42',
//		actions: [
//			tokenTransfer(
//				from: '9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
//				to: '9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
//				amount: 42,
//				tokenIdentifier: '/9SAusiPSyX8xJ3gbNJyYUHZaWz1jSYxXoBnWbzMAkcjhug6G3nLd/XRD'
//			)
//		]
//	}`
// `📡 tx status: 'confirmed'`
```

## Don't forget to handle your subscriptions!

```typescript
// At the end of the process, unsubscribe all subscribers. 
subs.unsubscribe()
```
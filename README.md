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

## NOT FINAL
⚠️ This API is not at all final. It will be changed, but it should give some kind of clue as to how to interact with this library.

## Wallet

We have a `WalletT` type being a **hierchal deterministic wallet** (explained by [Ledger Acadamy](https://www.ledger.com/academy/crypto/what-are-hierarchical-deterministic-hd-wallets) and on [BitcoinWiki](https://en.bitcoinwiki.org/wiki/Deterministic_wallet#HD_Wallet_.E2.80.93_Hierarchical_Deterministic_Wallet)) capable of deriving all "account"s you will need. Accounts in quoutes since it is really just a keypair and a [BIP44 path](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki) (recipie on how it was derived).

The trailing _T_ in `WalletT` is a suffix we use for all `type`s (we don't use [TypeScript `class`es](https://www.typescriptlang.org/docs/handbook/classes.html) at all). We reserve the `Wallet` name as a "namespaces" for our types, providing static-like factory/constructor methods, e.g. `Wallet.create` (N.B. the **lack of** trailing _T_). This decision was taken since we believe you will more often _use the namespace_ `Wallet.create` than you have to _declare the type_ `WalletT`. 

Here follows the generation of a new mnemonic and the creation of a wallet, via the saving of a keystore.

### Simple wallet creation

This outlines the most convenient wallet creation flow using `byEncryptingSeedOfMnemonicAndSavingKeystore`.

```typescript
import { Mnemonic, Strength, Language } from '@radixdlt/account'

// ⚠️ Require user to backup mnemonic. 
// She will NEVER be able to re-view it.
const mnemonic = Mnemonic.generateNew()

// This will be our "application password" (1️⃣)
// User choses this, however, please tell her to use 1Password to GENERATE a
// unique and strong encryption password. This password should be unique and strong.
// Urge user to backup this password.
const keystoreEncryptionPassword = confirmPasswordTextField.value() // or similar

// You need to pass in a function which saves the keystore
// this example uses 'fs' but using Electron/Browser you might
// wanna try out https://www.npmjs.com/package/fs-jetpack or similar.
const saveKeystoreOnDisc = (keystore: KeystoreT): Promise<void> => {
    import { PathLike, promises as fsPromises } from 'fs'
    const filePath = 'SOME/SUITABLE/PATH/keystore.json'
    const json = JSON.stringify(keystore, null, '\t')
    return fsPromises.writeFile(filePath, json)
}

// `walletResult` has type `ResultAsync<WalletT, Error>`
// `ResultAsync`: github.com/supermacro/neverthrow (2️⃣)
const walletResult = await Wallet.byEncryptingSeedOfMnemonicAndSavingKeystore({
	mnemonic,
	password: keystoreEncryptionPassword,
	save: saveKeystoreOnDisc,
})

if (walletResult.isErr()) {
	console.log(`🤷‍♂️ Failed to create wallet: ${walletResult.error}`)
} else {
	const wallet = walletResult.value
	// do something with 'wallet'
}
```

1️⃣: The `keystoreEncryptionPassword` will be needed everytime the user re-opens the wallet app after having terminated it. It's used to _decrypt_ the encrypted `hdMasterSeed`. Remember, the keystore is just a JSON file containing an encrypted ciphertext, and metadata about the encrypted used to derive said cihpertext. The ciphertext itself is the BIP39 "seed", not the entropy/mnemonic itself. The raw entropy and the mnemonic words/phrase is the very same thing! The mnemonic is just a easy-to-remember-mapping from bits to words! The seed, however, is a hashing of the entropy, so we can _**N E V E R**_ recover the mnemonic(=entropy) from the seed. Storing the seed (encrypted, of course!) should be consider just very slightly more safe then storing the entropy. But if attacker gets access of the seed, it is game over anyway, because the seed can be used to recover every singly account the user has.

2️⃣ Read more about [`Result` / `ResultAsync`](https://github.com/supermacro/neverthrow)


### Alternative wallet creation
Alternatively you can use a flow you have a bit more control. This is basically exactly what `Wallet.byEncryptingSeedOfMnemonicAndSavingKeystore` above does. 

```typescript
const mnemonic = Mnemonic.generateNew()
// ⚠️ Require user backup mnemonic first!
const masterSeed = HDMasterSeed.fromMnemonic({ mnemonic })

// Tell user to backup encryption password.
const keystoreEncryptionPassword = confirmPasswordTextField.value() // or similar

const walletResult = await Keystore.encryptSecret({
		secret: masterSeed.seed,
		password,
	})
	.map((keystore) => ({ keystore, filePath: keystorePath }))
	.andThen((keystore) => {
		// Save keystore on file and return an `ResultAsync<KeystoreT, Error>
	})
	.map((keystore) => ({ keystore, password: keystoreEncryptionPassword }))
	.andThen(Wallet.fromKeystore)

if (walletResult.isErr()) {
	console.log(`🤷‍♂️ Failed to create wallet: ${walletResult.error}`)
} else {
	const wallet = walletResult.value
	// do something with 'wallet'
}
```

### Open wallet (app start)

```typescript
// Path to where location where the keystore.json file will be saved.
import { Keystore } from "./keystore";
import { PathLike, promises as fsPromises } from 'fs'

// Each time GUI wallet starts ask user for encryption password in GUI
const keystoreEncryptionPassword = passwordTextField.value() // or similar

const loadKeystoreOnDisc = (): Promise<KeystoreT> => {
	const filePath = 'SOME/SUITABLE/PATH/keystore.json'
	return fsPromises.readFile(filePath)
         .then(buffer => Keystore.fromBuffer(buffer))
}

const walletResult = await Wallet.byLoadingAndDecryptingKeystore({
	password: keystoreEncryptionPassword
})

if (walletResult.isErr()) {
	console.log(`🤷‍♂️ Failed to create wallet: ${walletResult.error}`)
} else {
	const wallet = walletResult.value
	// do something with 'wallet'
}
```

## Observe account

```typescript

// RxJS subscription collection to store our subscriptions in
const subs = new Subscription()

wallet.observeActiveAccount()
    .subscribe((account) => { 
    	console.log(`🛂 Active account - hdPath: "${account.hdPath.toString()}"`)
    })
	.add(subs)

// `🛂 Active account - hdPath: "m/44'/536'/0'/0/0'"`
```

### What's an `AccountT`?

An account - having type `AccountT` - has this declaration:

```typescript
type AccountT = {
    hdPath: HDPathRadixT
    derivePublicKey: () => Observable<PublicKey>
    sign: (unsignedMessage: UnsignedMessage) => Observable<Signature>
    deriveAddress: () => Observable<AddressT>
}
```

The `hdPath` is the hierchal deterministic derivation path that was used to derive this account. The first account will have HD Path: `"m/44'/536'/0'/0/0'"`. The second: `"m/44'/536'/0'/0/1'"` etc. This can be used as an identifier and you can enable the users to provide a mapping between the HD path and a friendly name.

Further we see that the account can `sign` data, but more about that later. 

An account can also derive a public key. Note that this is done asynchrounous, resulting in a function `() => Observable<PublicKey>`. This might strike you as an odd inconvenience but it makes very much sense from an API design point of view. The reason for this is that we would like the API to be identical between `AccountT`s derived using the HDMasterSeed in your local `keystore.json` and `AccountT`s derived using a hardware wallet, e.g. `Ledger Nano S` (or X). The hardware wallet flow is async because the hardware device must derive the public key on and send it back to the host machine (Desktop wallet app, via this library) possibly with a manual confirmation step in between.

> 🧩 You never instantiate/create an account yourself, you always derive it from a `WalletT`.

Lastly we see that we can derive an `AddressT` from an account, we will talk about that in the next section.
 
## Observe address

A Radix address is the base58 encoding of two pieces of information: 
`UniverseMagicByte || PublicKey` plus some checksum bytes. The `UniverseMagicByte` or just `Magic` is an integer uniquely identifying the network. Which will have different values for e.g. our betanet and mainnet.

> 🧩 Thus we must know the universe magic before we can derive any Radix addresses from a public key.

It is safest to fetch the universe magic from a Radix Node in the network, via the Radix Core API (the lower level JSON-PRC API that this TypeScript library consumes).

The reason why you should not create an instance of `AccountT` yourself, but rather always derive it from `WalletT` is that the `deriveAddress()` observable will never emit any value! In fact
 the `deriveAddress()` called on an account derived from a wallet will never emit any value either - **not until you provide the `wallet` with `magic`**.

```typescript
const magicProvider$: Observable<Magic> = ...

// 💡 The crucial call `provideMagic` !
wallet.provideMagic(magicProvider$)
```
 
Do we have any magic provider by default? Yes using the API method `getMagic`, but for now the only thing you need to remoember is basically:
> 🧩 `deriveAddress` on accounts will never emit any value until you have provided `wallet` with magic.

For this reason it is most convenient to use our `Radix` type instead, and do:

```typescript
const node: Observable<Node> = Node.trusted('https://radixdlt.api.com')

const radix = Radix.create({ 
   wallet: wallet,
   node: node
})

const address$: Observable<AddressT> = radix.observeActiveAddress()
// 💡 Trailing `$` for `Observable` variables (3️⃣)

address$
	.subscribe((address) => console.log(`🙋🏽‍♀️ My address is: ${address.toString()}`))
	.add(subs)

// '🙋🏽‍♀️ My address is: 9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT'

radix.wallet.deriveNext({ alsoSwitchTo: true })
// '🙋🏽‍♀️ My address is: 9S8PWQF9smUics1sZEo7CrYgKgCkcopvt9HfWJMTrtPyV2rg7RAG'

radix.wallet.deriveNext({ alsoSwitchTo: true })
// '🙋🏽‍♀️ My address is: 9SAihkYQDBKvHfhvwEw4QBfx1rpjvta2TvmWibyXixVzX2JHHHWf'

radix.wallet.switchAccount({ to: AccountIndexPosition.FIRST })
// '🙋🏽‍♀️ My address is: 9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT'
```

3️⃣ The notation of using trailing `$` for `Observable` variables is documented by [Cycle.js](https://cycle.js.org/) and [Angular](https://angular.io/guide/rx-library#naming-conventions-for-observables)

The `address$: Observable<AddressT>` above emits values since we use the `radix` API, which under the hood performs the necessary calls to the Radix Core API and retreivese the necessary universe magic needed to derive addresses for each account.

### Account switching
Alternatives to the `switchAccount` call on the last line in the code block above:

```typescript
// SAME AS
radix.wallet.switchAccount({ to: 0 })
// SAME AS
const theAccountAtIndex0: AccountT = ... // you will have access to this from UI wallet, the list of the accounts, see `Observe Accounts` section below.
radix.wallet.switchAccount({ to: theAccountAtIndex0 })
```

Now it might not be clear why you would wanna use `{ to: AccountIndexPosition.FIRST }` instead of `{ to: 0}`, but the enum `AccountIndexPosition` also contains the case `LAST`, which is convenient. Compare:

```typescript
// Instead of
const numberOfAccounts = ... // you will have access to this from UI wallet, the list of the accounts, see `Observe Accounts` section below.
radix.wallet.switchAccount({ to: numberOfAccounts - 1 })

// You can simply call:
radix.wallet.switchAccount({ to: AccountIndexPosition.LAST })
```

## Observe Accounts (list)

In the code snippet above we called `radix.wallet.deriveNext()` twice, including the initial account we should now be able to list (print with `console.log`) our three accounts.

```typescript
const accounts$: Observable<Accounts> = radix.observeAccounts()

// 💡 we would also have `observeActiveAccount()` but the `observeActiveAddress` is probably
// most convenient for UI stuff.

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
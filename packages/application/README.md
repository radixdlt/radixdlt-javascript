# `@radixdlt/application`

High-level user-facing API for interacting with the [Radix decentralized ledger](https://www.radixdlt.com/).

### Intro

```typescript
import { Radix } from '@radixdlt/application'
import { Subscription } from 'rxjs'

const radix = Radix.create()
	.login('my strong password', loadKeystore)
	.connect(new URL('https://api.radixdlt.com'))

const subs = new Subscription()

radix.tokenBalances.subscribe(
	(tokenBalances) => console.log(`💎 My token balances ${tokenBalances.toString()}`)
).add(subs)

/* In the near future... */

// "💎 My token balances:
// [ 
//      1337.0 'XRD' ("Rads"), 
//      0.42 'rwBTC' ("Radix-Wrapped Bitcoin")
// ]"
```

Above code assumes you have a wallet. Looking for wallet creation?
> 💡 Please see [README of `@radixdlt/account` package](../../packages/account/README.md) for a detailed documentation about getting started with a wallet.

# Table of Contents
<!-- MarkdownTOC autolink="true" -->

- [`RadixT`](#radixt)
- [Reactive properties](#reactive-properties)
	- [Immortal state listeners](#immortal-state-listeners)
		- [Active address](#active-address)
		- [Account listing](#account-listing)
			- [Active account](#active-account)
		- [Token Balances](#token-balances)
	- [Errors sink](#errors-sink)
		- [Error "categories"](#error-categories)
- [Methods](#methods)
	- [Local methods](#local-methods)
		- [logLevel](#loglevel)
		- [Account derivation](#account-derivation)
			- [restoreAccountsUpToIndex](#restoreaccountsuptoindex)
		- [Account switching](#account-switching)
		- [Token balance fetch trigger](#token-balance-fetch-trigger)
		- [Staking fetch trigger](#staking-fetch-trigger)
		- [Decrypt](#decrypt)
		- [Sign](#sign)
	- [Methods resulting in RPC calls](#methods-resulting-in-rpc-calls)
		- [Transaction history](#transaction-history)
		- [Actions](#actions)
			- [`TokenTransfer`](#tokentransfer)
			- [`StakeTokens`](#staketokens)
			- [`UnstakeTokens`](#unstaketokens)
			- [`Other`](#other)
	- [Make Transaction](#make-transaction)
		- [Flow](#flow)
		- [`TransactionIntentBuilder`](#transactionintentbuilder)
			- [Unsafe user input](#unsafe-user-input)
		- [Example](#example)
			- [Build TX](#build-tx)
			- [Confirm TX](#confirm-tx)
			- [Submit TX](#submit-tx)
			- [Poll TX status](#poll-tx-status)
- [Ledger](#ledger)
		- [`tokenBalancesForAddress`](#tokenbalancesforaddress)
		- [`transactionHistory`](#transactionhistory)
		- [`nativeToken`](#nativetoken)
		- [`tokenInfo`](#tokeninfo)
		- [`stakesForAddress`](#stakesforaddress)
		- [`unstakesForAddress`](#unstakesforaddress)
		- [`transactionStatus`](#transactionstatus)
		- [`networkTransactionThroughput`](#networktransactionthroughput)
		- [`networkTransactionDemand`](#networktransactiondemand)
		- [`buildTransaction`](#buildtransaction)
		- [`submitSignedTransaction`](#submitsignedtransaction)
		- [`validators`](#validators)
		- [`lookupTransaction`](#lookuptransaction)
		- [`networkId`](#networkid)
- [Unsubscribe](#unsubscribe)
- [Footnotes](#footnotes)

<!-- /MarkdownTOC -->


# `RadixT`

All interactions with the Radix ledger is exposed via the reactive interface `Radix` (of type `RadixT`) - built with [RxJS 7 Beta (v13)](https://github.com/ReactiveX/rxjs/blob/master/CHANGELOG.md#700-beta13-2021-03-15). Let's see an example of how everything "just works" thanks to using RxJS.

In the code block above we create a `RadixT` instance and provide it with a [Hierarchical Deterministic (HD) wallet](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) by loading a keystore using a function of type `() => Promise<KeystoreT>` (above named `loadKeystore`). After the keystore has been loaded, it will be decrypted using the provided password and create a wallet value (of type `WalletT`). Which the RadixT type will use internally to manage accounts and expose method for creating new ones. **By default an initial account will be derived automatically**<sup id="defaultDerivationPath">[1](#defaultDerivationPath)</sup>. 

Lastly we [`subscribe`](https://rxjs-dev.firebaseapp.com/guide/observable#subscribing-to-observables) to the reactive stream `tokenBalances` which will automatically fetch the token balances for the address of the active "account". See (Fetch Trigger)[#fetchTrigger] continuous update of balance ("polling").

Since the Radix Ledger [supports multiple tokens](https://youtu.be/dQw4w9WgXcQ) for each address this will be a list of tokens, the [amount](https://github.com/radixdlt/radixdlt-javascript/blob/main/packages/primitives/src/_types.ts#L33-L48), their symbol ("ticker") and name. 

> 💡 Friendly reminder: the observables will not start emitting values until you have subscribed to them

> 💡 Friendly reminder: make sure to handle the returned value of the `subscribe()` function, by adding then to a [`Subscription`](https://rxjs-dev.firebaseapp.com/guide/subscription) object, otherwise behaviour is undefined, and you might experience all sorts of weird errors (e.g. memory leaks).
> 

However, we can also interact with the [Radix Core API](https://youtu.be/dQw4w9WgXcQ) without using any wallet, using the property `api`, like so:

```typescript
const subs = new Subscription()

const radix = Radix.create()
	.connect(new URL('https://api.radixdlt.com'))
	.setLogLevel(LogLevel.INFO)
	.ledger // accessing all RPC methods
	.nativeToken() // get token info about "XRD"
	.subscribe()
	.add(subs)

/* In the near future... */
// "💙 got nativeToken response: {
//      "name": "Rads",
//      "resourceIdentifier": "/9SAU2m7yis9iE5u2L44poZ6rYf5JiTAN6GtiRnsBk6JnXoMoAdks/XRD",
//      "symbol": "XRD",
//      "description": "The native currency of the Radix network",
//      "granularity": "1",
//      "hasMutableSupply": false,
//      "currentSupply": "12000000000",
//      "url": "https://https://www.radixdlt.com/",
//      "tokenUrl": "https://avatars.githubusercontent.com/u/34097377?s=280&v=4",
//      "tokenPermission": { "burn": "NONE", "mint": "NONE" }
// } "
```

In the code block above we did not provide any wallet and notice we access the property `ledger`, on which we called the method `nativeToken()` which observable stream we subsequently subscribe to. Lastly we handle the subscription. If we were to set the log level to `INFO` (from default of `WARNING`), we would not have seen the output `"💙 got nativeToken response..."`, neither would we if we wouldn't have called `subscribe()`, since all observables returned by _function calls_ are **lazy** (using [`defer`](https://rxjs-dev.firebaseapp.com/api/index/function/defer)).

> 💡 Everytime you'll see a heart emoji 💜💚💙💛❤️ it's a message logged from within this library (inspired by [SwiftBeaver](https://github.com/SwiftyBeaver/SwiftyBeaver#during-development-colored-logging-to-xcode-console)), representing `VERBOSE`, `DEBUG`, `INFO`, `WARNING` and `ERROR` log levels respectively.

The [`ledger` property is separately documented in the end of this document](#ledger)

# Reactive properties

In a GUI wallet you will most likely not use `radix.ledger` so much, but rather all the reactive properties (Observable variables) on the `radix` value directly. 

## Immortal state listeners

If any error where to be emitted on these reactive properties, they would complete (terminate), and you would miss out on any subsequently emitted value. We don't want that, why we've made sure that these never emit any value. All errors are redirected to the specific `errors` property, but [more about that later](#errors-sink). For now just remember that you will always get the latest and greatest data given the current active account from the `radix` interface.

### Active address
We can subscribe to the active address, which will emit the formatted radix public address of the active account.

If we create and switch to a new account, we will see how both our active address, and our token balances would update automatically.

```typescript
radix.activeAddress.subscribe(
	(address) => console.log(`🙋🏽‍♀️ my address is: '${address.toString()}'`)
).add(subs)

/* Instant */
// "🙋🏽‍♀️ my address is: '9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT'"

radix.deriveNextAccount({ alsoSwitchTo: true })

/* In the near future... */
// "🙋🏽‍♀️ my address is: '9S8PWQF9smUics1sZEo7CrYgKgCkcopvt9HfWJMTrtPyV2rg7RAG'"

// "💎 My token balances:
// [ 
//      237.0 'xwETH' ("Radix-Wrapped Ether")
// ]"
```

We subscribe to `activeAddress` which will automatically update with the address of our active "account". We will instantly see our initial account having address ending with _"6RT"_ logged, since we already have an active account. Moments later we create a new account and also switched to it. Since we have subscribed to both `tokenBalances` and `activeAddres`, this will emit the token balances of the new account as well as the address of the new account. 

> ⚠️ `activeAddress` will not emit any address until you have called connected to a node, because a network identifier fetched from the node is required to format an address.

### Account listing

We can subscribe to all our accounts and list them using the observable property `accounts`, like so:

```typescript
radix.accounts.subscribe(
	(accounts) => console.log(`[🙋🏾‍♀️, 🙋🏼‍♀️] my accounts are: ${accounts.toString()}`)
).add(subs)

/* Instant */
// "[🙋🏾‍♀️, 🙋🏼‍♀️] my accounts are: [
//      {
//          hdPath: "m/44'/536'/0'/0/0'"
//      },
//      {
//          hdPath: "m/44'/536'/0'/0/1'"
//      },
// ]
```

Well, that is not helpful! What are those? An account (of type `AccountT`) itself is not so user-friendly or beautiful to look at, it holds a reference to the derivation path used to derive it, and is in itself mostly a collection of functions. So printing them our in a console like this is not so helpful. However, when building a GUI wallet, we can display a clickable dropdown list of accounts and when a user selects an account we should switch to it. You can read about [account switching](#Account-switching) further down.

#### Active account
You can also subscribe to just the single active account

```typescript
radix.activeAccount.subscribe(
	(account) => console.log(`🙋🏾‍♀️ my active account: ${account.toString()}`)
).add(subs)

/* Instant */
// "🙋🏼‍ my active account: {
//  hdPath: "m/44'/536'/0'/0/0'"
// },
```

The `activeAccount` is probably not so useful, better to use the `activeAddress` and `accounts` properties

### Token Balances

In [the intro](#intro) we subscribed to the `tokenBalances`. This will get updated automatically when you switch account.

```typescript
radix
	.tokenBalances
	.subscribe((tokenBalances) => {
		console.log(`💎: ${tokenBalances.toString()}`)
	}
).add(subs)

/* In the near future... */
// "💎 My token balances:
// [ 
//      5.37 'rwBTC' ("Radix-Wrapped Bitcoin")
// ]"

// Later
radix
	.deriveNextAccount({ alsoSwitchTo: true })

/* In the near future... */
// "💎 My token balances:
// [ 
//      8541.37 'rwETH' ("Radix-Wrapped Ether")
// ]"
```

See (Fetch Trigger)[#fetchTrigger] for a way either scheduling fetching of token balances at a regular interval ("polling"), or triggering a single fetch when user presses a "Fetch Now" button in GUI.

## Errors sink

Since RxJS observable finishes on error, and would stop emitting values after an error, we have made sure all errors are caught and redirected to the `errors` property (of type `Observable<ErrorNotification>). Meaning that all reactive properties you can listen for values on are immortal.

Apart from logging (controlled with the `setLogLevel` method as seen in [intro](#intro) and [documented below](#setloglevel)) it is probably a good idea to listen to errors and handle them appropriately. To be clear, **you probably should _act upon_ these errors**, either you (as a GUI wallet developer) or prompt the user to take appropriate action(s).

```typescript
radix.errors.subscribe(
	(errorNotification) => { 
		console.log(`☣️ error ${error.toString()}`)
		// Maybe tot only log, but also act upon...	
	},
)

// "☣️ error { 'tag': 'node', msg: 'Invalid SSL certificate' }"
// "☣️ error { 'tag': 'wallet', msg: 'Failed to decrypt wallet' }"
// "☣️ error { 'tag': 'api', msg: 'Request timed out' }"
```

The `radix.errors` reactive property is in itself immortal and will never error out, so do **not** add a subscriber to the `error` event, but rather the `next` event**s**.

### Error "categories"
The `errors` property emits three different category of errors, each error is tagged with a 'category', each can be regarded as a separate error channel/stream, and you can choose to split it into separate channels if you'd like.

```typescript
import { Observable } from 'rxjs'
import { ErrorNotification, WalletError, ErrorNotification } from '@radixdlt/application'

const splitErrorNotificationsOnCategory = (category: ErrorCategory): Observable<ErrorNotificationT> => radix.errors.pipe(
	filter((errorNotification) => errorNotification.category === category),
)

const walletErrors = splitErrorNotificationsOnCategory(ErrorCategory.WALLET)

walletErrors.subscribe(
	(errorNotification) => {
		if (errorNotification.cause === WalletErrorCause.LOAD_KEYSTORE_FAILED) {
			console.log(`⚠️ failed to load keystore: '${errorNotification.message}'`)
			// Aslo display error message in GUI.
		}
	}
)
```

You can access the underlying error `cause` and even `message` with more details.

# Methods

## Local methods

None of these methods will result in any RPC call to the Radix Core API. All methods perform local computation only.

### logLevel

Sets the log level of the internal logger of this SDK. We use [loglevel](https://github.com/pimterry/loglevel). By default, only error and warning logs will visible to you. Lower the log level to see more information.

```typescript
radix.logLevel('error')
```

The log levels available are `debug`, `error`, `warn`, `info`, and `silent`.

### Account derivation
You can create new accounts with `deriveNextAccount()`, which takes an optional `alsoSwitchTo` argument, which changes the current active account.

If you build a GUI wallet you probably want to **locally save** either a list of the derived accounts, i.e. their hdpaths or you might want to save the account with the highest value (the index of the last one), so that you can restore them upon app start.

For your convenience we provide you with a specific method for this

#### restoreAccountsUpToIndex

> ⚠️ Not yet implemented, subject to change.

You can "restore" all accounts up to some last known index. This does **not** switch the active account. If you passed in the value `0` nothing will happen.

```typescript
const localStore = localPersistentStoreAt('some/local/path') // or similar
const lastAccountIndex: number = localStore.loadLastAccountIndex() //  or similar

radix.accounts.subscribe(
	(accounts) => console.log(`🙋🏾‍[] I have #${accounts.length} accounts`)
).add(subs)

radix
	.restoreAccountsUpToIndex(lastAccountIndex)
	.subscribe({
		complete: () => console.log(`✅ Finished restoring accounts`)
	})
	.add(subs)


/* Later */
// "🙋🏾‍♀️[] I have #10 accounts"
// "✅ Finished restoring accounts"
```

### Account switching

```typescript
radix
	.switchAccount('first')
	.switchAccount({ toIndex: 1 })
	.switchAccount({ toIndex: 0 })
	.switchAccount('last')

/* Instant */
// "🙋🏽‍♀️ my address is: '9S8k...V6RT'"
// "🙋🏽‍♀️ my address is: '9S8P...7RAG'"
// "🙋🏽‍♀️ my address is: '9S8k...V6RT'"
// "🙋🏽‍♀️ my address is: '9S8P...7RAG'"
```

A GUI wallet would probably want to send in the selected account (of type `AccountT`) rather than use `'first' | 'last' | { toIndex: number }` though. Which looks like this:

```typescript
const selectedAccount: AccountT = accountListInGUI.selectedItem() // or similar
radix.switchAccount({ toAccount: selectedAccount })

/* Instant */
// "🙋🏽‍♀️ my address is: <THE_ADDRESS_OF_THE_SELECTED_ACCOUNT>"
```

TODO: 👀 we might want to make it possible to give each account a human-readable name, or that might be something a GUI wallet _should_ be responsible for.

### Token balance fetch trigger

You can specify a fetch trigger (polling):

```typescript
import { timer } from 'rxjs'

radix
	.withTokenBalanceFetchTrigger(
		interval(3 * 60 * 1_000), // every third minute
	)
```

The above code will make sure you automatically perform a fetch of token balances every third minute. 

### Staking fetch trigger

Use `withStakingFetchTrigger` to specify a fetch trigger for unstakes/stakes. See `balance fetch trigger` for details.

### Decrypt

> ⚠️ Not yet implemented, subject to change.

You can decrypt encrypted messages using the private key of the active account in transactions like so:

```typescript
radix
	.decryptMessageInTransaction(transaction)
	.subscribe({
		next: (decrypted) => { console.log(`✅🔓 successfully decrypted message: ${decrypted.message.toString()}`) },
		error: (failure) => { console.log(`❌🔐 failed to decrypt message, wrong account? ${failure.toString()}`) },
	})
	.add(subs)
```

### Sign

> ⚠️ Not yet implemented, subject to change.

You can sign arbitrary data using the private key of the active account, typically you will not use this since you will use higher level method `transferTokens` which also handles the signing part. This should be considered a more low level API for signing generic data.

```typescript
radix
	.wallet
	.sign({ unhashed: 'I approve of this message.'.toString('hex')}) // will sha256 hash
	.subscribe(
		(signed) => console.log(`📝 
			signed message '${signed.message.toString()}', 
			with related private key of public key: ${signed.publicKey.toString()}, 
			resulting in signature: '${signed.signature.toString()}'
		`)
	)
	.add(subs)
```


## Methods resulting in RPC calls

### Transaction history

> ⚠️ Not yet implemented, subject to change.

A transaction is not a token transfer, however, a token transfer might be _one_ action amongst _many_ in a transaction.

Transaction history might be long, and is for that sake paginated. So `RadixT` needs some kind of _"cursor"_ together with a `size`, telling it where and how many transactions to fetch from the Radix Distributed Ledger. 

```typescript
radix.transactionHistory({
	size: 3,
}).subscribe(
	(txs) => console.log(`📒⏱ transaction history: ${txs.toString()} ⏱📒`)
).add(subs)

/* In the near future... */
// "📒⏱ transaction history: 
//	{
//		"cursor": "FadedBeeFadedBeeFadedBeeFadedBeeFadedBeeFadedBeeFadedBeeFadedBee",
//		"transactions": [
//			{
//				"id": "DeadBeefDeadBeefDeadBeefDeadBeefDeadBeefDeadBeefDeadBeefDeadBeef",
//				"type": "incoming",
//				"sentAt": "2021-03-14",
//				"fee": "0.0123",
//				"message": {
//					"msg": "51358bd242d0436b738dad123ebf1d8b2103ca9978dbb11cb9764e0bcae41504b4521f0290ac0f33fa659528549//	d9ce84d230000003096dc6785ea0dec1ac1ae15374e327635115407f9ae268aad8b4b6ebae1afefbc83c5792de6fc3550d3//	e0383918d182e87876c9c0e3b5ca0c960fd95b4bd18421ead2aaf472012e7cfbfd7b314cbae588",
//					"encryptionScheme": "ECIES_DH_ADD_AES_GCM_V0"
//				},
//				"actions": [
//					{
//						"type": "TokenTransfer",
//						"from": "9SBRrNSxu6zacM8qyuUpDh4gNqou8QX6QEu53LKVsT4FXjvD77ou",
//						"to": "9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT",
//						"amount": "1337",
//						"resourceIdentifier": "/9SAU2m7yis9iE5u2L44poZ6rYf5JiTAN6GtiRnsBk6JnXoMoAdks/XRD"
//					}
//				]
//			},
//			{
//				"id": "ADeadBeeADeadBeeADeadBeeADeadBeeADeadBeeADeadBeeADeadBeeADeadBee",
//				"type": "outgoing",
//				"sentAt": "2021-03-09",
//				"fee": "0.0095",
//				"actions": [
//					{
//						"type": "TokenTransfer",
//						"from": "9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT",
//						"to": "9S9tQA7v1jSEUTvLk3hTp9fTmWNsA1ppJ3D6dHLxoqnPcYayAmQf",
//						"amount": "1.25",
//						"resourceIdentifier": "/9SAU2m7yis9iE5u2L44poZ6rYf5JiTAN6GtiRnsBk6JnXoMoAdks/GOLD",
//					}
//				]
//			},
//			{
//				"id": "FadedBeeFadedBeeFadedBeeFadedBeeFadedBeeFadedBeeFadedBeeFadedBee",
//				"type": "outgoing",
//				"sentAt": "2021-01-27",
//				"fee": "0.0087",
//				"actions": [
//					{
//						"type": "Stake",
//						"from": "9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT",
//						"toDelegate": "9S81XtkW3H9XZrmnzWqYSuTFPhWXdRnnpL3XXk7h5XxAM6zMdH7k",
//						"amount": "250",
//						"resourceIdentifier": "/9SAU2m7yis9iE5u2L44poZ6rYf5JiTAN6GtiRnsBk6JnXoMoAdks/XRD",
//					}
//				]
//			},
//		]
//	}
// ⏱📒
// "
```

Wow 😅, that's a mouthful... Let's break it down. We call subscribe to the observable returned by the method call to `transactionHistory(...)` and after a short delay log the received object. It contains some "cursor", being a pointer to the last transaction, we can use this for subsequent pagination pages. We also see an array of "transactions". Each transaction has:  
1. An identifier.  
2. A type (`incoming`, `outgoing` or `unrelated`).
3. A date.  
4. A token fee (paid in the native token ("Rad"/`XRD`)).  
5. An **optional**, encrypted, message.
6. A list of actions, more about [these below](#actions).

Above we saw an example fetching the 3 earliest transactions for an address.

We are unable to read the message attached to the first transaction, since it is encrypted. **Messages are _not_ decrypted automatically when received**, you have to manual ask for a message to be decrypted, reade more about [decryption here](#decrypt).

You ought to keep track of the returned `cursor` value in the `transactionHistory` response, since you can use that you query the next "page", like so:

```typescript

import { Option, none } from 'prelude-ts'
import { TransactionIdentifierT } from '@radixdlt/application'
import { Subject } from 'rxjs'

const cursor: Option<TransactionIdentifierT> = none()
const fetchTXTrigger = new Subject<number>()

fetchTXTrigger.pipe(
	mergeMap((pageSize) => {
		radix.transactionHistory({
			size: pageSize,
			cursor: cursor.getOrNull()
		})
	})
).subscribe(
	(txs) => { 
		cursor = Option.of(txs.cursor)
		console.log(`📒📃 got #${txs.size} transactions`)
	}
).add(subs)

fetchTXTrigger.next(20) // fetch tx 0-19
fetchTXTrigger.next(20) // fetch tx 20-33

/* In the near future... */
// 📒📃 got #20 transactions
// 📒📃 got #14 transactions
```

In the code block above we use `cursor` to fetch two different "pages" of the transaction history, but this account only had 34 transactions, so the second page only contained 14 entries.

We use a [Subject (RxJS)](https://rxjs-dev.firebaseapp.com/guide/subject) to trigger the multiple calls to `transactionHistory`, in combination with [`mergeMap` ("flatMap)](https://www.learnrxjs.io/learn-rxjs/operators/transformation/mergemap) to transform the observable from `number => TransactionHistory` . An important thing to note is that we *update the cursor upon receiving each new "page"*.

See (Fetch Trigger)[#fetchTrigger] for a way either scheduling fetching of transaction history at a regular interval ("polling"), or triggering a single fetch when user presses a "Fetch Now" button in GUI.

### Actions

#### `TokenTransfer`
A transfer of some tokens, of a specific amount. This is probably the most relevant action.

#### `StakeTokens`
Staking of native tokens.

#### `UnstakeTokens`
Unstaking of staked native tokens.

#### `Other`
Two differnt kinds of actions fall in under this category:  
1. Advanced actions: Well known actions that user cannot perform from the GUI wallet (`MintTokens` action amongst others).
2. Unknown actions: Ledger instructions that are not on canonical form (or otherwise unknown)


## Make Transaction

> ⚠️ Not yet implemented, subject to change.

Here we show how to transfer tokens, which is one of potentially several _actions_, making up a _transaction_.

The flow of making a transaction is the same, disregarding the contents of it, i.e. if you only make a single _token transfer_ action, or a single _stake tokens_ action, the flow remains the same.

### Flow

1. 🙋🏾‍♀️ `user`**`inputs`** transaction details (recipient, amount, token etc) and passes inputs to library.
2. 💻 `wallet`**`transforms`** unsafe inputs into validated `TransactionIntent`.  
3. 🛠 `library`**`requests`** Radix Core API to build transaction from intent and returns built transaction with human-readable fee to wallet.
4. OPTIONAL 💻 `wallet`**`displays`** transaction fee and waits for user to confirm transaction with PIN code.
5. 🛠 `library`**`signs`** transaction and returns txID (transactionID) to wallet.
6. 🛠 `library`**`submits`** signed transaction to Radix Core API which promtly returns initial OK/ERR response, wallet handles this initial response.
7. 💻 `wallet`**`polls`** status of transaction (using txID from step 5), using appropriate library api, and informs user of final CONFIRMED/REJECTED result. 
8. 🙋🏾‍♀️ `user`**`acts`** on any failures, e.g. presses "Retry"-button, if prompted with one because of network connection issues during step 6.


### `TransactionIntentBuilder`

#### Unsafe user input

Let us transfer some tokens! All methods accept specific types such as `AddressT` for recipient address, `AmountT` for token amounts and `ResourceIdentierT` for token identifier (which you have access to via `tokenBalances`, `nativeToken()` and `transactionHistory()`).

> 💡 Amount of tokens to send must be a multiple of the token's granularity

You can read out the _granularity_ (of type `AmountT`) from the token info, by using `radix.ledger.tokenInfo(tokenResourceIdentifier)`.

For convenience you can pass in unsafe types, such as `string` as input to all actions, below we create a transaction intent with a single  `transferTokens` action. 

```typescript
import { TransactionIntentBuilder } from '@radixdlt/application'

TransactionIntentBuilder.create()
	.transferTokens({
		to: '9SBZ9kzpXKAQ9oHHZngahVUQrLwU6DssiPbtCj5Qb6cxqxPC6stb',
		amount: '12.57',
		tokenIdentifier: '/9SAU2m7yis9iE5u2L44poZ6rYf5JiTAN6GtiRnsBk6JnXoMoAdks/XRD'
	})
	.message('Thx for lunch Bob, let me pay for my salad.')
	.build({
		encryptMessageIfAnyWithAccount: activeAccount$, // Observable<AccountT>
	})
	.subscribe(
		(transactionIntent) => {
			console.log(`🎉 transactionIntent: ${transactionIntent.toString()}`)
		},
		(error) => {
			console.log(`🤷‍♂️ Failed to create transaction intent: ${error}`)
		},
	)
	.add(subs)
```

Alternatively you can transform input to save types eagerly, display relevant info for validation errors, and then pass these safe types to the `TransactionIntent`.

<details><summary>Pass safe types (Click to expand ⬇️)</summary>

```typescript
import { Amount } from '@radixdlt/primitives'
import { Address } from '@radixdlt/account'
import { Transaction } from '@radixdlt/application'

const recipientAddressString = recipientTextField.value() // or similar
const recipientAddressResult = Address.fromBase58String(recipientAddressString)
if (recipientAddressResult.isErr()) {
	console.log(`Invalid addres string, error: ${recipientAddressResult.error.message}`)
}
const recipientAddress: AddressT = recipientAddressResult.value

const fooToken: ResourceIdentifierT = selectedToken.id // or similar, read from `tokenBalances`.
const tokenGranularity = radix.ledger
	.tokenInfo(fooToken)
	.subscribe((token) => {
		console.log(`🔶🟠🔸 granularity of token ${token.name} : ${token.granularity.toString()}, any transfer of this token MUST be a multiple of this amount.`)
	}).add(subs)

// Later when we know granularity of token.

const amountString = amountTextField.value() // or similar
const amountResult = Amount.fromUnsafe(amountString)
if (amountResult.isErr()) {
	console.log(`Invalid amount string, did you input a number?`)
}
const unsafeAmount: AmmountT = amountResult.value

if (!unsafeAmount.isMultipleOf(granularity)) {
	console.log(`⚠️ requested amount to send is not a mulltiple of token granularity, will be unable to send`)
	// 💡 also inform user in GUI
	// Abort token sending
}

// ☑️ Amount is checked against token granularity, safe to send.
const amount = unsafeAmount

TransactionIntentBuilder.create()
	.transferTokens({
		to: recipientAddress, // safe type `AddressT`
		amount: amount, // safe type `AmounT`
		token: fooToken // safe type `ResourceIdentifierT`
	})
	.message(`Thx for lunch Bob, here's for my salad.`)
	.build(...)
	.subscribe(...)
	.add(subs)

```

</details>


### Example

Here follows an axample of how we can make a transaction using, `buildTransactionFromIntent` and `submitSignedTransaction`.

We use the [`transactionIntent` we built with `TransactionIntentBuilder` earlier](#TransactionIntentBuilder).


#### Build TX

> ⚠️ Not yet implemented, subject to change.

```typescript
const askUserToConfirmTransactionSubject = new Subject<UnsignedTransaction>()
const userDidConfirmTransactionSubject = new Subject<UnsignedTransaction>()
const pendingTransactionsSubject = new Subject<SignedTransaction>()

radix
	.buildTransactionFromIntent({ 
		intent: transactionIntent, // from earlier
	})
	.pipe(
		tap((unsignedTxForUserToConfirm) => {
			const txFee = unsignedTxForUserToConfirm.fee
			console.log(`💵 tx fee: ${txFee.toString()}`)
			askUserToConfirmTransactionSubject.next(unsignedTxForUserToConfirm)
		})
	)
	.subscribe({ // Don't forget to subscribe
		error: (e) => {
			// Handle build tx errors
			if (isBuildTransactionError(e)) {
				switch (e) {
					case BuildTransactionError.INSUFFICIENT_FUNDS:
						console.log(`Insufficient funds`)
						// Display error to user
						return
					case BuildTransactionError.AMOUNT_NOT_MULTIPLE_OF_GRANULARITY:
						console.log(`Amount not multiple of granularity`)
						// Display error to user
						return
				}
			} else {
				console.log(`Unknown error building tx`)
			}
		},
	})
	.add(subs)
```

#### Confirm TX

Require `userDidConfirmTransactionSubject` to emit value, either automatically done, or requiring manual input from user.

Here follows some pseudocode for what to do in GUI wallet.

Either **automatically confirm tx**

```typescript
askUserToConfirmTransactionSubject
	.subscribe((tx) => userDidConfirmTransactionSubject.next(tx))
	.add(subs)
```

Or **require manual confirmation**, we could protect tx sending with an app PIN code in this step.

```typescript
askUserToConfirmTransactionSubject
	.subscribe((tx) => {
		// DISPLAY DIALOG with "Confirm TX" button, when clicked
		function onConfirmButtonClick() { // when button
			userDidConfirmTransactionSubject.next(tx)
		}
	})
	.add(subs)
```

#### Submit TX

> ⚠️ Not yet implemented, subject to change.

When transaction is confirmed, either automatically or mannually by user, it is ready to be signed an submitted.

```typescript
userDidConfirmTransactionSubject.pipe(
	mergeMap((unsignedUserConfirmedTx) => radix.sign(unsignedUserConfirmedTx)),
	tap((signedTransaction) => {
		const txId = signedTransaction.id
		console.log(`🆔 transaction id: ${txId.toString()}`)
		pendingTransactionsSubject.next(signedTransaction)
	}),
	mergeMap((signedTransaction) => radix.submitSignedTransaction(signedTransaction)),
)
	.subscribe({ // Don't forget to subscribe
		error: (e) => {
			// Handle tx submission errors
			if (isSubmitTransactionError(e)) {
				switch (e) {
					case SubmitTransactionError.INVALID_SIGNATURE:
						console.log(`Failed to sign transaction, wrong account?`)
				}
			} else {
				console.log(`Unknown error submitting tx`)
			}
		},
	})
	.add(subs)
```

#### Poll TX status

Now that the transaction has been submitted, we can proceed with polling the status of it.

```typescript
const pollTxStatusTrigger = timer(5 * 1_000) // every 5 seconds

const transactionStatus$ = pollTxStatusTrigger
	.withLatestFrom(pendingTransactionsSubject)
	.pipe(
		mergeMap((signedTransaction) => 
			radix
				.ledger
				.statusOfTransactionById(signedTransaction.id)
				.pipe(
					map((status) => ({
						status,
						signedTransaction.id,
					})
				) 
			),
		)
	)

const transactionConfirmed$ = transactionStatus$.pipe(
	takeWhile(({ status, _ }) => status !== TransactionStatus.CONFIMRED),
)

transactionStatus$
	.subscribe(({ status, id }) => console.log(`🔮 Status ${status.toString()} of tx with id: ${id.toString()}`)) 
	.add(subs)

// 🔮 Status: INITIATED, 
// 🔮 Status: PENDING, 
// 🔮 Status: CONFIRMED, 

transactionConfirmed$
	.subscribe(({ _, id }) => console.log(`✅ Tx with id ${id.toString()} confirmed`))
	.add(subs)

// ✅ Status confirmed`
```

# Ledger

> ☑️ Mocked implementation only 🤡.

This outlines all the requests you can make to the Radix Core API. All these requests are completely independent of any wallet, thus they have no notion of any "active address".

**We have finished mocking all methods below.**


### `tokenBalancesForAddress`

> ☑️ Mocked implementation only 🤡.

Balance per token for specified address.

Method signature:

```typescript
tokenBalancesForAddress: (address: AddressT) => Observable<TokenBalances>
```

### `transactionHistory`
> ☑️ Mocked implementation only 🤡.

A page of the transaction history for the specified address. Pagination behaviour is controlled using input `size` and `cursor`.

Method signature:

```typescript
transactionHistory: (
	input: Readonly<{
		address: AddressT
		size: number // must be larger than 0
		cursor?: string
	}>,
) => Observable<TransactionHistory>
```

### `nativeToken`
> ☑️ Mocked implementation only 🤡.

Information about the native token of the Radix network.

Method signature:

```typescript
nativeToken: () => Observable<Token>
```

### `tokenInfo`

> ☑️ Mocked implementation only 🤡.

Information about specified token.

Method signature:

```typescript
tokenInfo: (resourceIdentifier: ResourceIdentifierT) => Observable<Token>
```

### `stakesForAddress`

> ☑️ Mocked implementation only 🤡.

Current stakes to validators for given address.

Method signature:

```typescript
stakesForAddress: (address: AddressT) => Observable<StakePositions>
```

### `unstakesForAddress`

> ☑️ Mocked implementation only 🤡.

Current unstakes from validators for given address.

Method signature:

```typescript
unstakesForAddress: (address: AddressT) => Observable<UnstakePositions>
```

### `transactionStatus`
> ☑️ Mocked implementation only 🤡.
```typescript
transactionStatus: (id: TransactionIdentifierT) => Observable<StatusOfTransaction>
```

### `networkTransactionThroughput`

> ☑️ Mocked implementation only 🤡.

Information about specified token.

Method signature:

```typescript
networkTransactionThroughput: () => Observable<NetworkTransactionThroughput>
```

### `networkTransactionDemand`

> ☑️ Mocked implementation only 🤡.

Information about specified token.

Method signature:
```typescript
networkTransactionDemand: () => Observable<NetworkTransactionDemand>
```

### `buildTransaction`

> ☑️ Mocked implementation only 🤡.

Information about specified token.

Method signature:

```typescript
buildTransaction: (
	intent: TransactionIntent,
) => Observable<UnsignedTransaction>
```

### `submitSignedTransaction`

> ☑️ Mocked implementation only 🤡.

Information about specified token.

Method signature:

```typescript
submitSignedTransaction: (
	signedTransaction: SignedTransaction,
) => Observable<PendingTransaction>
```

### `validators`

> ☑️ Mocked implementation only 🤡.

Information about specified token.

Method signature:

```typescript
validators: (input: {
	// pagination
	size: number // must be larger than 0
	cursor?: AddressT // address of validator in last page
}): Observable<Validators>
```

### `lookupTransaction`

> ☑️ Mocked implementation only 🤡.

Looks up an executed transaction by a txID. Observable will emit an error if no transaction matching the id is found.

Method signature:

```typescript
lookupTransaction: (txID: TransactionIdentifierT): Observable<ExecutedTransaction>
```

### `networkId`

> ☑️ Mocked implementation only 🤡.

Unique identifier for the network, part of each address (prefix).

Method signature:

```typescript
networkId: () => Observable<Magic>
```

# Unsubscribe

> 💡 Friendly reminder: when deemed appropriate, dispose of tour subscriptions by `unsubscribe`

It's impossible to say when appropriate, that is up to you.

```typescript
// Earlier
const subs = new Subscription()

// Sometime you did
someObservable.subscribe().add(subs)

// Later
subs.unsubscribe()
```


# Footnotes

<b id="defaultDerivationPath">1:</b> At [derivation path (BIP44)](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki#Path_levels) `"m/44'/536'/0'/0/0'"`.

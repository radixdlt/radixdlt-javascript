
This library is intended for use specifically within the Radix Desktop Wallet, not for general use. It is undocumented, unsupported, and may be changed at any time. Use at your own risk.  We have disabled issues, although PRs with bug fixes will be considered.

For the Olympia mainnet release, no language-specific libraries are offered and we instead recommend use of the simple JSON RPC and REST API endpoints offered by the Radix node. These cover the full token and staking functionality of Olympia, sufficient for exchange or wallet integration.

The later Alexandria and Babylon releases will focus more on developer functionality and so heavily refactored APIs and new libraries are expected to start to be introduced at that time. We expect these new APIs and libraries to become the primary method of programmatic interaction with the Radix network at its Babylon release.

## Build and run tests

```
yarn build && yarn bootstrap
yarn test
```

## Publish a new release

When new changes have been merged into the main branch, and you want to publish a new version, make sure you're up to date with main branch locally and do:

```
yarn release
```

It will automatically bump the versions in the changed packages, update the changelog, commit and publish to npm.

For commits to main branch, please follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).


# Usage
**WORK IN PROGRESS**

## Creating a new `Radix` instance

```
import { Radix, Wallet } from 'radixdlt-javascript` 

const walletResult = Wallet.new('parrot try blind immune drink stay three cluster ship draw fluid become despair primary curtain')

if (walletResult.isErr()) throw walletResult.error

const wallet = walletResult.value

const radix = Radix.new(wallet)
await radix.connect('http://localhost:8080')
```

or, in a style that maps the result:

```
import { Radix, Wallet } from 'radixdlt-javascript` 

const result =
  Wallet.new('parrot try blind immune drink stay three cluster ship draw fluid become despair primary curtain')
  .map(
    wallet => Radix.new(wallet)
  )

if (result.isErr()) throw result.error

const radix = result.value
await radix.connect('http://localhost:8080')
```


## Saving a keystore

```
await wallet.saveKeystore('path/to/keystore')
```


Creating a `Radix` instance from a saved keystore:

```
import { Radix, Wallet } from 'radixdlt-javascript`
import fs from 'fs'

const keystore = fs.readFileSync('path/to/keystore/keystore.json')

const result =
  Wallet.fromKeystore(keystore)
  .map(
    wallet => Radix.new(wallet)
  )

if (result.isErr()) throw result.error

const radix = result.value
```


## Managing accounts

```
let activeAccount

activeAccount = await radix.activeAccountPromise() // account at index 0
await radix.deriveNextAccount()
activeAccount = await radix.activeAccountPromise() // account at index 1

await radix.switchAccount(0)

activeAccount = await radix.activeAccountPromise() // account at index 0
```

Subscribing to data stream:

```
const sub = radix.activeAccount.subscribe(account => console.log(account))

sub.unsubscribe() // stop polling
```


## Interacting with the network

### Getting token balances

As a continuous data stream:

```
const sub = radix.tokenBalances.subscribe(
   result => { // invoked every second
      if (result.isErr()) // handle error

      const balances = result.value
   }
)

sub.unsubscribe() // stops polling
```

as a one-off response:

```
const result = await radix.tokenBalancesPromise()

if (result.isErr()) throw result.error

const balances = result.value
```

### Getting a validator

```
const result = await radix.lookupValidator('rv1qvz3anvawgvm7pwvjs7xmjg48dvndczkgnufh475k2tqa2vm5c6cq4mrz0p')

if (result.isErr()) throw result.error

const validator = result.value
```

### Sending tokens

```
const { status, completion } = radix.transferTokens(
  'rdx1qsps28kdn4epn0c9ej2rcmwfz5a4jdhq2ez03x7h6jefvr4fnwnrtqqjaj7dt', // recipient address
  10, // amount
  'xrd_rb1qya85pwq' // token identifier,
  {
    plaintext: 'this is a message!',
    encrypted: false
  },
  confirm => {
    // waiting for confirmation before continuing
    confirm()
  }
)

status.subscribe(status => console.log(event))

const result = await completion

if (result.isErr()) // handle error

const txID = result.value
```





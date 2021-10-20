
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

```
import { Radix } from 'radixdlt-javascript`

const radix = Radix.create()
await radix.connect('http://localhost:8080')
```


```
radix.
```
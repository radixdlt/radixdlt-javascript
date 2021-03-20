# `@radixdlt/account`

Account related APIs for Radix.

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

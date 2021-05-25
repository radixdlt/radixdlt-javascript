import { Wallet, WalletT } from '../src'
import { NetworkT } from '@radixdlt/primitives'
import { SigningKeychain } from '@radixdlt/account'
import { Mnemonic } from '@radixdlt/crypto'

export const createWallet = (
	input?: Readonly<{
		network?: NetworkT
		startWithInitialSigningKey?: boolean
	}>,
): WalletT => {
	const mnemonic = Mnemonic.fromEnglishPhrase(
		'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
	)._unsafeUnwrap()
	const startWithInitialSigningKey = input?.startWithInitialSigningKey ?? true
	const signingKeychain = SigningKeychain.create({
		mnemonic,
		startWithInitialSigningKey,
	})

	const network = input?.network ?? NetworkT.BETANET

	return Wallet.create({
		signingKeychain,
		network,
	})
}

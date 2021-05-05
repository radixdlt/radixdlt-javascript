import { WalletT } from '../src'
import { Wallet } from '../src/wallet'
import { Mnemonic, NetworkT, SigningKeychain } from '@radixdlt/account'

export const createWallet = (
	input?: Readonly<{ network?: NetworkT; startWithInitialSigningKey?: boolean }>,
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

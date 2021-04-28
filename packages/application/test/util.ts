import { IdentityManagerT } from '../src'
import { IdentityManager } from '../src/identityManager'
import { Mnemonic, NetworkT, Wallet } from '@radixdlt/account'

export const createIM = (
	input?: Readonly<{ network?: NetworkT; startWithAnAccount?: boolean }>,
): IdentityManagerT => {
	const mnemonic = Mnemonic.fromEnglishPhrase(
		'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
	)._unsafeUnwrap()
	const startWithAnAccount = input?.startWithAnAccount ?? true
	const wallet = Wallet.create({ mnemonic, startWithAnAccount })

	const network = input?.network ?? NetworkT.BETANET

	return IdentityManager.create({
		wallet,
		network,
	})
}

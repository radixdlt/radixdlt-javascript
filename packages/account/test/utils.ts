import { privateKeyFromScalar } from '@radixdlt/crypto'
import { UInt256 } from '@radixdlt/uint256'
import { Mnemonic, Wallet, WalletT } from '../src'

export const makeWalletWithFunds = (): WalletT => {
	const wallet = Wallet.create({
		startWithAnAccount: false,
		mnemonic: Mnemonic.generateNew(), // not used,
	})

	const addPK = (privateKeyScalar: number): void => {
		const privateKey = privateKeyFromScalar(
			UInt256.valueOf(privateKeyScalar),
		)._unsafeUnwrap()
		wallet.addAccountFromPrivateKey({
			privateKey,
			alsoSwitchTo: true,
			name: `Account with funds, privateKey: ${privateKeyScalar}`,
		})
	}

	addPK(1)
	addPK(2)
	addPK(3)
	addPK(4)
	addPK(5)

	wallet.switchAccount('first')
	if (
		wallet.__unsafeGetAccount().publicKey.toString(true) !==
		'0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'
	) {
		throw new Error('incorrect imple')
	}

	return wallet
}

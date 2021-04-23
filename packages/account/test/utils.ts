import { PrivateKey, privateKeyFromScalar } from '@radixdlt/crypto'
import { UInt256 } from '@radixdlt/uint256'
import {
	AccountAddress,
	AccountAddressT,
	HDPathRadixT,
	Mnemonic,
	Wallet,
	WalletT,
} from '../src'

export const makeWalletWithFunds = (): WalletT => {
	return Wallet.__unsafeCreateWithPrivateKeyProvider({
		mnemonic: Mnemonic.generateNew(), // not used,
		__privateKeyProvider: (hdPath: HDPathRadixT): PrivateKey => {
			const privateKeyScalar: number =
				(hdPath.addressIndex.value() % 10000) + 1 // `0` is not a valid key.
			return privateKeyFromScalar(
				UInt256.valueOf(privateKeyScalar),
			)._unsafeUnwrap()
		},
	})
}

// TODO CODE DUPLICATION remove to separate test package...
export const toAddress = (bech32String: string): AccountAddressT =>
	AccountAddress.fromUnsafe(bech32String)._unsafeUnwrap()

const alice = toAddress(
	'brx1qsp8n0nx0muaewav2ksx99wwsu9swq5mlndjmn3gm9vl9q2mzmup0xqmhf7fh',
)
const bob = toAddress(
	'brx1qspnn7enq9a0yhnppx50gz2njjt8p0gvns7x3uzvpdnvuhy7nwt3gpce2qk0c',
)

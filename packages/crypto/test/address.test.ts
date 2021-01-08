import {
	addressFromPublicKeyAndMagic,
	addressFromBase58String,
	privateKeyFromScalar,
	PublicKey,
} from '../src/_index'

import { magicFromNumber } from '@radixdlt/primitives'
import { UInt256 } from '@radixdlt/uint256'

const buffersEquals = (lhs: Buffer, rhs: Buffer): boolean => {
	return Buffer.compare(lhs, rhs) === 0
}

const pubKeysEquals = (lhs: PublicKey, rhs: PublicKey): boolean => {
	const comparePubKeyBytes = (compressed: boolean): boolean => {
		const bytesFromKey = (pubKey: PublicKey): Buffer => {
			return pubKey.asData({ compressed })
		}
		return buffersEquals(bytesFromKey(lhs), bytesFromKey(rhs))
	}
	return comparePubKeyBytes(true) && comparePubKeyBytes(false)
}

describe('Address', () => {
	it('can be created from a publicKey and radix magix', async () => {
		const privateKey = privateKeyFromScalar(UInt256.valueOf(1))
		const publicKey = (await privateKey.derivePublicKey())._unsafeUnwrap()
		const magic = magicFromNumber(1337)

		const address = addressFromPublicKeyAndMagic({
			publicKey: publicKey,
			magic: magic,
		})
		const expctedAddressBase58 =
			'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT'
		expect(address.toString()).toBe(expctedAddressBase58)

		const addressFromString = addressFromBase58String(
			expctedAddressBase58,
		)._unsafeUnwrap()

		expect(
			pubKeysEquals(publicKey, addressFromString.publicKey),
		).toBeTruthy()

		expect(addressFromString.magicByte.toString()).toBe(
			magic.byte.toString(),
		)
	})
})

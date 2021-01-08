import { publicKeyFromBytes, addressFromPublicKeyAndMagic } from '../src/_index'

import { magicFromNumber } from '@radixdlt/primitives'

describe('Address', () => {
	it('can be created from a publicKey and radix magix', () => {
		const publicKeyResult = publicKeyFromBytes(
			Buffer.from(
				'0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
				'hex',
			),
		)

		const publicKey = publicKeyResult._unsafeUnwrap()
		expect(publicKey.asData({ compressed: true }).toString('hex')).toBe(
			'0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
		)
		expect(publicKey.asData({ compressed: false }).toString('hex')).toBe(
			'0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8',
		)

		const magic = magicFromNumber(1337)

		const address = addressFromPublicKeyAndMagic({
			publicKey: publicKey,
			magic: magic,
		})
		expect(address.toString()).toBe(
			'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
		)
	})
})

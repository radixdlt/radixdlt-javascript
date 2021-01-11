import {
	addressFromPublicKeyAndMagic,
	addressFromBase58String,
	privateKeyFromScalar,
	publicKeysEquals,
	addressesEqual,
	Address,
} from '../src/_index'

import { magicFromNumber } from '@radixdlt/primitives'
import { UInt256 } from '@radixdlt/uint256'

const toAddress = (b58: string): Address =>
	addressFromBase58String(b58)._unsafeUnwrap()

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
			publicKeysEquals(publicKey, addressFromString.publicKey),
		).toBeTruthy()

		expect(addressFromString.magicByte.toString()).toBe(
			magic.byte.toString(),
		)

		expect(addressesEqual(addressFromString, address)).toBe(true)
	})

	it('should consider the same address to be equal itself', () => {
		const makeAddress = (): Address =>
			toAddress('9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT')
		expect(addressesEqual(makeAddress(), makeAddress())).toBe(true)
	})

	it('should consider two different address with the same magic but different publicKeys as inequal', async () => {
		const alice = toAddress(
			'9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
		)
		const bob = toAddress(
			'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
		)
		expect(alice.magicByte).toBe(bob.magicByte)
		expect(addressesEqual(alice, bob)).toBe(false)
	})
})

import { UInt256 } from '@radixdlt/uint256'
import { AddressT, Address } from '../src/_index'

import { magicFromNumber } from '@radixdlt/primitives'
import { OutputMode } from '@radixdlt/data-formats'
import { generatePrivateKey, privateKeyFromScalar } from '@radixdlt/crypto'

// TODO CODE DUPLICATION remove to separate test package...
export const toAddress = (b58: string): AddressT =>
	Address.fromBase58String(b58)._unsafeUnwrap()

describe('Address', () => {
	it('can generate new', async () => {
		const privateKey = generatePrivateKey()
		const publicKey = privateKey.publicKey()
		const magic = magicFromNumber(1337)

		const address = Address.fromPublicKeyAndMagic({
			publicKey: publicKey,
			magic: magic,
		})

		expect(Address.isAddress(address)).toBe(true)
	})

	it('can be created from a publicKey and radix magix', async () => {
		const privateKey = privateKeyFromScalar(
			UInt256.valueOf(1),
		)._unsafeUnwrap()
		const publicKey = privateKey.publicKey()
		const magic = magicFromNumber(1337)

		const address = Address.fromPublicKeyAndMagic({
			publicKey: publicKey,
			magic: magic,
		})

		expect(Address.isAddress(address)).toBe(true)

		const expctedAddressBase58 =
			'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT'
		expect(address.toString()).toBe(expctedAddressBase58)

		const addressFromString = Address.fromBase58String(
			expctedAddressBase58,
		)._unsafeUnwrap()

		expect(publicKey.equals(addressFromString.publicKey)).toBeTruthy()

		expect(addressFromString.magicByte.toString()).toBe(
			magic.byte.toString(),
		)

		expect(addressFromString.equals(address)).toBe(true)
	})

	it('should consider the same address to be equal itself', () => {
		const makeAddress = (): AddressT =>
			toAddress('9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT')
		expect(makeAddress().equals(makeAddress())).toBe(true)
	})

	it('should consider two different address with the same magic but different publicKeys as inequal', async () => {
		const alice = toAddress(
			'9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
		)
		const bob = toAddress(
			'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
		)
		expect(alice.magicByte).toBe(bob.magicByte)
		expect(alice.equals(bob)).toBe(false)
	})

	it('should be able to DSON encode', () => {
		const address = toAddress(
			'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
		)
		const dson = address.toDSON(OutputMode.ALL)._unsafeUnwrap()

		expect(dson.toString('hex')).toBe(
			'582704390279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798b1186a1e',
		)
	})

	it('should be able to JSON encode', () => {
		const raw = '9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT'
		const address = toAddress(raw)
		const json = address.toJSON()._unsafeUnwrap()
		if (!json) fail('Should have json')
		expect(json.toString()).toBe(`${Address.JSON_TAG}${raw}`)
	})

	it('should be able to JSON decode', () => {
		const raw = '9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT'
		const expected = toAddress(raw)

		const decoded = Address.fromJSON(
			`${Address.JSON_TAG}9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT`,
		)._unsafeUnwrap()
		expect(decoded.equals(expected)).toBe(true)
	})
})

import { UInt256 } from '@radixdlt/uint256'
import { AddressT, Address } from '../src'

import { magicFromNumber } from '@radixdlt/primitives'
import { generatePrivateKey, privateKeyFromScalar } from '@radixdlt/crypto'
import { log } from '@radixdlt/util'

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

	// You can delete this...
	describe('localnetjson address', () => {
		const make = (privateKeyScalar: number): AddressT => {
			const privateKey = privateKeyFromScalar(
				UInt256.valueOf(privateKeyScalar),
			)._unsafeUnwrap()
			const publicKey = privateKey.publicKey()
			const magic = magicFromNumber(1803288578)
			return Address.fromPublicKeyAndMagic({ publicKey, magic })
		}

		type Vector = {
			pk: number
			addr: string
		}

		const vectors: Vector[] = [
			{
				pk: 1,
				addr: 'JF5FTU5wdsKNp4qcuFJ1aD9enPQMocJLCqvHE2ZPDjUNag8MKun',
			},
			{
				pk: 2,
				addr: 'JFeqmatdMyjxNce38w3pEfDeJ9CV6NCkygDt3kXtivHLsP3p846',
			},
			{
				pk: 3,
				addr: 'JG3Ntbhj144hpz2ZooKsQG3Hq7UkCMwmFMwXfaYQgKFzNXAQvo5',
			},
			{
				pk: 4,
				addr: 'JFtJPDGvw4NDQyqCk7P5pWudNMeT8TFGCSvY9pTEqiyVhUGM9R9',
			},
			{
				pk: 5,
				addr: 'JEWaBeWxn9cju3i6SA5A41FWkBUn8hvRYHCtPh26rCRnumyVCfP',
			},
		]

		const doTestVector = (vector: Vector): void => {
			it('should produce correct addr', () => {
				if (make(vector.pk).toString() === vector.addr) {
					log.dev(`🚀 match for ${JSON.stringify(vector, null, 4)}`)
				}
				expect(make(vector.pk).toString()).toBe(vector.addr)
			})
		}

		vectors.forEach((v) => {
			doTestVector(v)
		})
	})
})

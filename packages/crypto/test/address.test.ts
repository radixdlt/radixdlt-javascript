import {
	addressFromPublicKeyAndMagic,
	addressFromBase58String,
	privateKeyFromScalar,
	Address,
	isAddress,
	JSON_TAG,
	generatePrivateKey,
} from '../src/_index'

import { magicFromNumber } from '@radixdlt/primitives'
import { UInt256 } from '@radixdlt/uint256'
import { OutputMode } from '@radixdlt/data-formats'

// TODO CODE DUPLICATION remove to separate test package...
export const toAddress = (b58: string): Address =>
	addressFromBase58String(b58)._unsafeUnwrap()

describe('Address', () => {
	it('can generate new', async () => {
		const privateKey = generatePrivateKey()
		const publicKey = (await privateKey.derivePublicKey())._unsafeUnwrap()
		const magic = magicFromNumber(1337)

		const address = addressFromPublicKeyAndMagic({
			publicKey: publicKey,
			magic: magic,
		})

		expect(isAddress(address)).toBe(true)
	})

	it('can be created from a publicKey and radix magix', async () => {
		const privateKey = privateKeyFromScalar(UInt256.valueOf(1))
		const publicKey = (await privateKey.derivePublicKey())._unsafeUnwrap()
		const magic = magicFromNumber(1337)

		const address = addressFromPublicKeyAndMagic({
			publicKey: publicKey,
			magic: magic,
		})

		expect(isAddress(address)).toBe(true)

		const expctedAddressBase58 =
			'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT'
		expect(address.toString()).toBe(expctedAddressBase58)

		const addressFromString = addressFromBase58String(
			expctedAddressBase58,
		)._unsafeUnwrap()

		expect(publicKey.equals(addressFromString.publicKey)).toBeTruthy()

		expect(addressFromString.magicByte.toString()).toBe(
			magic.byte.toString(),
		)

		expect(addressFromString.equals(address)).toBe(true)
	})

	it('should consider the same address to be equal itself', () => {
		const makeAddress = (): Address =>
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

	it('can be checked for magic byte', () => {
		// PLEASE KEEP - used as Cast of characters: https://en.wikipedia.org/wiki/Alice_and_Bob#Cast_of_characters
		const alice = toAddress(
			'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
		)
		const bob = toAddress(
			'9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
		)
		const carol = toAddress(
			'9S8sKfN3wGyJdfyu9RwWvGKtZqq3R1NaxwT63VXi5dEZ6dUJXLyR',
		)
		const dan = toAddress(
			'9SBFdPAkvquf9XX82D2Z9DzL2WdmNQGcrxFUnKpVytpkMjZWD9Rb',
		)
		const erin = toAddress(
			'9S8LZFHXHTSJqNQ86ZeGKtFMJtqZbYPtgHWSC4LyYjSbduNRpDNN',
		)
		const frank = toAddress(
			'9SBRR1Xa3RRw1M7juwLTHfL1T2Y7XMZJJM6YyJjqddSLGaH2dk9c',
		)
		const grace = toAddress(
			'9S9AtsDC1eR6QSLwrTRi2vteWCg2C1VDMySStFaZVRpMrvErXzBV',
		)
		const heidi = toAddress(
			'9S9y4d9owF7kuRk7b14VhfwrBxHe3w9ukbAcbnoLtBFvjWhTCXpz',
		)
		const ivan = toAddress(
			'9SBRrNSxu6zacM8qyuUpDh4gNqou8QX6QEu53LKVsT4FXjvD77ou',
		)
		const judy = toAddress(
			'9S9tQA7v1jSEUTvLk3hTp9fTmWNsA1ppJ3D6dHLxoqnPcYayAmQf',
		)
		const klara = toAddress(
			'9S8np84gn7skz8U2Vd7GwkvSMzSksMLqAq7nrpu2hA2a31M2rmfD',
		)
		const leonard = toAddress(
			'9S8toEsjy7bLLVYwenrygbEiQDBiSYen4GDEGan5y6nGMXzKT22G',
		)
		const mallory = toAddress(
			'9SBZ9kzpXKAQ9oHHZngahVUQrLwU6DssiPbtCj5Qb6cxqxPC6stb',
		)
		const niaj = toAddress(
			'9S9X7DFSGTbfiQpSw1Dv9DHK67K1qHtz1Kjwd2uFtty7Yz8dmZbc',
		)
		const olivia = toAddress(
			'9S81XtkW3H9XZrmnzWqYSuTFPhWXdRnnpL3XXk7h5XxAM6zMdH7k',
		)
		const peggy = toAddress(
			'9SAGS7iVkjLDa2uoqzvybBJZP5RJd6XLzoeSmqur9WWXoKs7hPqz',
		)
		const quentin = toAddress(
			'9SB4Hvi9sudHncGXhUhuvUYNWziMYYcXXiDZ6i7fpSvRUDCA3rjg',
		)
		const rupert = toAddress(
			'9SAusiPSyX8xJ3gbNJyYUHZaWz1jSYxXoBnWbzMAkcjhug6G3nLd',
		)
		const stella = toAddress(
			'9S8PWQF9smUics1sZEo7CrYgKgCkcopvt9HfWJMTrtPyV2rg7RAG',
		)
		const ted = toAddress(
			'9SAihkYQDBKvHfhvwEw4QBfx1rpjvta2TvmWibyXixVzX2JHHHWf',
		)
		const ursula = toAddress(
			'9SAzQV3ei2g4qcHpvnMSuEGUYREPgcHvQyBNvkHdop18DDyEqpSY',
		)
		const victor = toAddress(
			'9S8PQU9jcALCeXW6sXarwHxjKLqCUM4AkiecSMwdjfUWhdPws9tx',
		)
		const webdy = toAddress(
			'9S9T39u425jJfAkWRYPPhpBFdkU5f1KWBuMPg7mWnCQ2abAFSnoZ',
		)
		const xerxez = toAddress(
			'9SBA2tji3wjuuThohxW37L6vySVuVaUpBFBpq2b7Ey7sKToU2uJp',
		)
		const yara = toAddress(
			'9SBaXGCwn8HcyPsbu4ymzNVCXtvogf3vSqnH39ihqt5RyDFq9hsv',
		)
		const zelda = toAddress(
			'9SAU2m7yis9iE5u2L44poZ6rYf5JiTAN6GtiRnsBk6JnXoMoAdks',
		)

		const castOfCharacters: Address[] = [
			alice,
			bob,
			carol,
			dan,
			erin,
			frank,
			grace,
			heidi,
			ivan,
			judy,
			klara,
			leonard,
			mallory,
			niaj,
			olivia,
			peggy,
			quentin,
			rupert,
			stella,
			ted,
			ursula,
			victor,
			webdy,
			xerxez,
			yara,
			zelda,
		]

		expect(castOfCharacters.length).toBe(new Set(castOfCharacters).size)

		castOfCharacters.forEach((address) => {
			expect(address.magicByte).toBe(magicFromNumber(1337).byte)
		})
	})

	it('should be able to JSON encode', () => {
		const raw = '9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT'
		const address = toAddress(raw)
		const json = address.toJSON()

		expect(json.toString()).toBe(`${JSON_TAG}${raw}`)
	})
})

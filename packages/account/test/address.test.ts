import { Address } from '../src'

import {
	privateKeyFromBuffer,
	publicKeyCompressedByteCount,
	sha256Twice,
} from '@radixdlt/crypto'
import { NetworkT } from '../dist'
import { msgFromError } from '@radixdlt/util'

describe('account_address_on_bech32_format', () => {
	describe('addr from seeded private key', () => {
		type PrivateKeySeedVector = {
			privateKeySeed: string
			expectedAddr: string
			network: NetworkT
		}
		const privateKeySeedVectors: PrivateKeySeedVector[] = [
			{
				privateKeySeed: '00',
				expectedAddr:
					'brx1qsps28kdn4epn0c9ej2rcmwfz5a4jdhq2ez03x7h6jefvr4fnwnrtqqjqllv9',
				network: NetworkT.BETANET,
			},
			{
				privateKeySeed: 'deadbeef',
				expectedAddr:
					'brx1qspsel805pa0nhtdhemshp7hm0wjcvd60a8ulre6zxtd2qh3x4smq3sraak9a',
				network: NetworkT.BETANET,
			},
			{
				privateKeySeed: 'deadbeefdeadbeef',
				expectedAddr:
					'brx1qsp7gnv7g60plkk9lgskjghdlevyve6rtrzggk7x3fwmp4yfyjza7gcumgm9f',
				network: NetworkT.BETANET,
			},
			{
				privateKeySeed: 'bead',
				expectedAddr:
					'brx1qsppw0z477r695m9f9qjs3nj2vmdkd3rg4mfx7tf5v0gasrhz32jefqwxg7ul',
				network: NetworkT.BETANET,
			},
			{
				privateKeySeed: 'aaaaaaaaaaaaaaaa',
				expectedAddr:
					'brx1qspqsfad7e5k2k9agq74g40al0j9cllv7w0ylatvhy7m64wyrwymy5g7md96s',
				network: NetworkT.BETANET,
			},
		]

		const doTest = (vector: PrivateKeySeedVector, index: number): void => {
			it(`vector_index${index}`, () => {
				const seed = Buffer.from(vector.privateKeySeed, 'hex')
				const hash = sha256Twice(seed)
				const privateKey = privateKeyFromBuffer(hash)._unsafeUnwrap()
				const publicKey = privateKey.publicKey()

				const addr = Address.fromPublicKeyAndNetwork({
					publicKey,
					network: vector.network,
				})
				expect(addr.toString()).toBe(vector.expectedAddr)
				expect(addr.network).toBe(vector.network)

				const parsedAddress = Address.fromUnsafe(
					vector.expectedAddr,
				)._unsafeUnwrap()
				expect(parsedAddress.toString()).toBe(vector.expectedAddr)
				expect(parsedAddress.toString()).toBe(addr.toString())
				expect(parsedAddress.publicKey.equals(publicKey)).toBe(true)

				expect(parsedAddress.equals(addr)).toBe(true)
				expect(addr.equals(parsedAddress)).toBe(true)
			})
		}

		privateKeySeedVectors.forEach((v, i) => doTest(v, i))
	})

	describe('rri roundtrip', () => {
		type RRIDesVector = {
			address: string
			data: string
		}

		const reAddressToRri: RRIDesVector[] = [
			{
				address:
					'brx1qspqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs7cr9az',
				data: '02'.repeat(publicKeyCompressedByteCount),
			},
		]
		const doTest = (vector: RRIDesVector, index: number): void => {
			it(`rri_deserialization_vector_index${index}`, () => {
				const address = Address.fromUnsafe(
					vector.address,
				)._unsafeUnwrap()
				expect(address.toString()).toBe(vector.address)
				expect(address.publicKey.toString(true)).toBe(vector.data)
			})
		}

		reAddressToRri.forEach((v, i) => doTest(v, i))
	})

	describe('test non happy paths', () => {
		beforeAll(() => {
			jest.spyOn(console, 'error').mockImplementation(() => {})
		})

		afterAll(() => {
			jest.clearAllMocks()
		})

		type InvalidVector = {
			invalidAddr: string
			failureReason: string
		}

		const invalidVectors: InvalidVector[] = [
			{
				invalidAddr:
					'vb1qvz3anvawgvm7pwvjs7xmjg48dvndczkgnufh475k2tqa2vm5c6cq9u3702',
				failureReason: 'invalid hrp',
			},
			{
				invalidAddr: 'brx1xhv8x3',
				failureReason: 'invalid address length 0',
			},
			{
				invalidAddr: 'brx1qqnrjk8r',
				failureReason: 'invalid address type (0)',
			},
			{
				invalidAddr: 'brx1qsqsyqcyq5rqzjh9c6',
				failureReason: 'invalid length for address type 4',
			},
		]

		const doTest = (invalidVector: InvalidVector, index: number): void => {
			it(`invalid_vector_index${index}`, () => {
				Address.fromUnsafe(invalidVector.invalidAddr).match(
					(_) => {
						throw new Error(
							`Got success, but expected failure, rri: ${invalidVector.invalidAddr}`,
						)
					},
					(e) => {
						expect(msgFromError(e).length).toBeGreaterThan(1)
					},
				)
			})
		}
		invalidVectors.forEach((v, i) => doTest(v, i))
	})
})

import { privateKeyFromBuffer, sha256Twice } from '@radixdlt/crypto'
import { ValidatorAddress } from '../src'
import { NetworkT } from '../dist'

describe('validator_address_on_bech32_format', () => {

	it('can be parsed from string', () => {
		const string = 'vb1qvz3anvawgvm7pwvjs7xmjg48dvndczkgnufh475k2tqa2vm5c6cq9u3702'

		ValidatorAddress.fromUnsafe(string).match(
			(addr) => {
				// expect(rri.name).toBe('xrd')
				expect(addr.network).toBe(NetworkT.BETANET)
				expect(addr.toString()).toBe(string)
			},
			(e) => {
				throw e
			},
		)
	})


		describe('addr from seeded private key', () => {
			type PrivateKeySeedVector = {
				privateKeySeed: string
				expectedAddr: string
				network: NetworkT
			}
			const privateKeySeedVectors: PrivateKeySeedVector[] = [
				{
					privateKeySeed: "00",
					expectedAddr:
						'vb1qvz3anvawgvm7pwvjs7xmjg48dvndczkgnufh475k2tqa2vm5c6cq9u3702',
					network: NetworkT.BETANET
				},
				{
					privateKeySeed: "deadbeef",
					expectedAddr:
						'vb1qvx0emaq0tua6md7wu9c047mm5krrwnlfl8c7ws3jm2s9uf4vxcyvrwrazy',
					network: NetworkT.BETANET
				},
				{
					privateKeySeed: "deadbeefdeadbeef",
					expectedAddr:
						'vb1q0jym8jxnc0a4306y95j9m07tprxws6ccjz9h352tkcdfzfysh0jxll64dl',
					network: NetworkT.BETANET
				},
				{
					privateKeySeed: "bead",
					expectedAddr:
						'vb1qgtnc40hs73dxe2fgy5yvujnxmdnvg69w6fhj6drr68vqac525k2gkfdady',
					network: NetworkT.BETANET
				},		{
					privateKeySeed: "aaaaaaaaaaaaaaaa",
					expectedAddr:
						'vb1qgyz0t0kd9j4302q8429tl0mu3w8lm8nne8l2m9e8k74t3qm3xe9z8l2049',
					network: NetworkT.BETANET
				},
			]

			const doTest = (vector: PrivateKeySeedVector, index: number): void => {
				it(`vector_index${index}`, () => {
					const seed = Buffer.from(vector.privateKeySeed, 'hex')
					const hash = sha256Twice(seed)
					const privateKey = privateKeyFromBuffer(hash)._unsafeUnwrap()
					const publicKey = privateKey.publicKey()

					const addr = ValidatorAddress.fromPublicKeyAndNetwork({
						publicKey,
						network: vector.network,
					})

					expect(addr.toString()).toBe(vector.expectedAddr)
					expect(addr.network).toBe(vector.network)
				})
			}

			privateKeySeedVectors.forEach((v, i) => doTest(v, i))
		})
/*
		describe('rri roundtrip', () => {
			type RRIDesVector = {
				rri: string
				name: string
				data: string
			}

			const reAddressToRri: RRIDesVector[] = [
				{
					rri: 'xrd_rb1qya85pwq',
					name: 'xrd',
					data: '01',
				},
				{
					rri: 'xrd2_rb1qy557l44',
					name: 'xrd2',
					data: '01',
				},
				{
					rri:
						'usdc_rb1qvqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gwwwd',
					name: 'usdc',
					data: `03${'00'.repeat(26)}`,
				},
				{
					rri:
						't2t2t2_rb1qvpsxqcrqvpsxqcrqvpsxqcrqvpsxqcrqvpsxqcrqvpsmr9n0r',
					name: 't2t2t2',
					data: `03${'03'.repeat(26)}`,
				},
			]
			const doTest = (vector: RRIDesVector, index: number): void => {
				// it(`rri_serialization_vector_index${index}`, () => {
				// 	const rri = ResourceIdentifier.withNameAndHash({
				// 		hash: Buffer.from(vector.data, 'hex'),
				// 		name: vector.name,
				// 	})._unsafeUnwrap()
				//
				// 	expect(rri.toString()).toBe(vector.rri)
				// 	expect(rri.name).toBe(vector.name)
				// 	expect(rri.hash.toString('hex')).toBe(vector.data)
				// })
				it(`rri_deserialization_vector_index${index}`, () => {
					const rri = ResourceIdentifier.fromUnsafe(
						vector.rri,
					)._unsafeUnwrap()

					expect(rri.hash.toString('hex')).toBe(vector.data)

					expect(rri.toString()).toBe(vector.rri)
					expect(rri.name).toBe(vector.name)
				})
			}

			reAddressToRri.forEach((v, i) => doTest(v, i))
		})

		describe('rri system', () => {
			type SystemRRIVector = {
				name: string
				expectedRRI: string
			}
			const privateKeyAndNameToRri: SystemRRIVector[] = [
				{
					name: 'xrd',
					expectedRRI: 'xrd_rb1qya85pwq',
				},
				{
					name: 'foo',
					expectedRRI: 'foo_rb1qy3q706k',
				},
				{
					name: 'bar',
					expectedRRI: 'bar_rb1qy6gq5vc',
				},
				{
					name: 'alex',
					expectedRRI: 'alex_rb1qy7s58lc',
				},
				{
					name: 'gold',
					expectedRRI: 'gold_rb1qydtpdac',
				},
				{
					name: 'btcrw',
					expectedRRI: 'btcrw_rb1qyerpvjk',
				},
				{
					name: 'ethrw',
					expectedRRI: 'ethrw_rb1qyeev2v5',
				},
			]

			const doTest = (vector: SystemRRIVector, index: number): void => {
				it(`vector_index${index}`, () => {
					const rri = ResourceIdentifier.systemRRI(
						vector.name,
					)._unsafeUnwrap()

					expect(rri.name).toBe(vector.name)
					expect(rri.toString()).toBe(vector.expectedRRI)
				})
			}
			privateKeyAndNameToRri.forEach((v, i) => doTest(v, i))
		})

		describe('test non happy paths', () => {
			beforeAll(() => {
				jest.spyOn(console, 'error').mockImplementation(() => {})
			})

			afterAll(() => {
				jest.clearAllMocks()
			})

			it('rri checksum invalid bech32 string', () => {
				const rri = 'xrd_rb1qya85pw1' // "w1" should have been "wq";
				ResourceIdentifier.fromUnsafe(rri).match(
					(_) => {
						throw new Error('Expected error but got none')
					},
					(e) => {
						expect(msgFromError(e).length).toBeGreaterThan(0)
					},
				)
			})

			type InvalidVector = {
				invalidRRI: string
				failureReason: string
			}

			const invalidVectors: InvalidVector[] = [
				{
					invalidRRI: 'xrd1pzdsczc',
					failureReason: 'no _rb suffix',
				},
				{
					invalidRRI: 'xrd_rb1avu205I',
					failureReason: 'invalid address type (0)',
				},
				{
					invalidRRI: 'usdc_rb1qg8vs72e',
					failureReason: 'invalid address type (2)',
				},
				{
					invalidRRI: 'usdc_rb1qqqsqs6ztc',
					failureReason: 'invalid length for address type 1',
				},
				{
					invalidRRI: 'usdc_rb1qvgxjc9r',
					failureReason: 'invalid length for address type 3',
				},
				{
					invalidRRI:
						'xrd_2_rb1qvpsxqcrqvpsxqcrqvpsxqcrqvpsxqcrqvpsxqcrqvpszyaqyw',
					failureReason: 'invalid characters in hrp',
				},
			]

			const doTest = (invalidVector: InvalidVector, index: number): void => {
				it(`invalid_vector_index${index}`, () => {
					ResourceIdentifier.fromUnsafe(invalidVector.invalidRRI).match(
						(_) => {
							throw new Error(
								`Got success, but expected failure, rri: ${invalidVector.invalidRRI}`,
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

	 */
})
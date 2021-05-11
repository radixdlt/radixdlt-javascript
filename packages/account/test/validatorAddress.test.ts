import { PrivateKey, sha256Twice } from '@radixdlt/crypto'
import { ValidatorAddress, NetworkT } from '../src'
import { msgFromError, restoreDefaultLogLevel } from '@radixdlt/util'
import { log } from '@radixdlt/util'

describe('validator_address_on_bech32_format', () => {
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
					'vb1qvz3anvawgvm7pwvjs7xmjg48dvndczkgnufh475k2tqa2vm5c6cq9u3702',
				network: NetworkT.BETANET,
			},
			{
				privateKeySeed: 'deadbeef',
				expectedAddr:
					'vb1qvx0emaq0tua6md7wu9c047mm5krrwnlfl8c7ws3jm2s9uf4vxcyvrwrazy',
				network: NetworkT.BETANET,
			},
			{
				privateKeySeed: 'deadbeefdeadbeef',
				expectedAddr:
					'vb1q0jym8jxnc0a4306y95j9m07tprxws6ccjz9h352tkcdfzfysh0jxll64dl',
				network: NetworkT.BETANET,
			},
			{
				privateKeySeed: 'bead',
				expectedAddr:
					'vb1qgtnc40hs73dxe2fgy5yvujnxmdnvg69w6fhj6drr68vqac525k2gkfdady',
				network: NetworkT.BETANET,
			},
			{
				privateKeySeed: 'aaaaaaaaaaaaaaaa',
				expectedAddr:
					'vb1qgyz0t0kd9j4302q8429tl0mu3w8lm8nne8l2m9e8k74t3qm3xe9z8l2049',
				network: NetworkT.BETANET,
			},
		]

		const doTest = (vector: PrivateKeySeedVector, index: number): void => {
			it(`vector_index${index}`, () => {
				const seed = Buffer.from(vector.privateKeySeed, 'hex')
				const hash = sha256Twice(seed)
				const privateKey = PrivateKey.fromBuffer(hash)._unsafeUnwrap()
				const publicKey = privateKey.publicKey()

				const addr = ValidatorAddress.fromPublicKeyAndNetwork({
					publicKey,
					network: vector.network,
				})
				expect(addr.toString()).toBe(vector.expectedAddr)
				expect(addr.network).toBe(vector.network)

				const parsedAddress = ValidatorAddress.fromUnsafe(
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

	describe('test non happy paths', () => {
		beforeAll(() => {
			log.setLevel('silent')
			jest.spyOn(console, 'error').mockImplementation(() => {})
		})

		afterAll(() => {
			restoreDefaultLogLevel()
			jest.clearAllMocks()
		})

		type InvalidVector = {
			invalidAddr: string
			failureReason: string
		}

		const invalidVectors: InvalidVector[] = [
			{
				invalidAddr:
					'vb1qvx0emaq0tua6md7wu9c047mm5krrwnlfl8c7ws3jm2s9uf4vxcyvrwrazz',
				failureReason: 'bad checksum',
			},
			{
				invalidAddr: 'xrd_rr1gd5j68',
				failureReason: 'Bad hrp',
			},
			{
				invalidAddr: 'vb1qqweu28r',
				failureReason: 'Not enough bytes for public key',
			},
		]

		const doTest = (invalidVector: InvalidVector, index: number): void => {
			it(`invalid_vector_index${index}`, () => {
				ValidatorAddress.fromUnsafe(invalidVector.invalidAddr).match(
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

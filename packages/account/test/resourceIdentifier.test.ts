import { isResourceIdentifier, NetworkT, ResourceIdentifier } from '../src'
import { msgFromError, restoreDefaultLogLevel } from '@radixdlt/util'
import { PrivateKey } from '@radixdlt/crypto'
import { UInt256 } from '@radixdlt/uint256'
import { log } from '@radixdlt/util'

describe('rri_on_bech32_format', () => {
	it('xrd rri can be parsed from string', () => {
		const rriString = 'xrd_rb1qya85pwq'

		ResourceIdentifier.fromUnsafe(rriString).match(
			rri => {
				expect(rri.name).toBe('xrd')
				expect(rri.toString()).toBe(rriString)
				expect(rri.network).toBe(NetworkT.BETANET)
			},
			e => {
				throw e
			},
		)
	})

	it('can create mainnet rri that not equals rri of betanet with same name.', () => {
		const name = 'foo'
		const network = NetworkT.MAINNET
		const rriMainnet = ResourceIdentifier.systemRRIForNetwork({
			name,
			network,
		})._unsafeUnwrap()
		expect(rriMainnet.network).toBe(network)
		expect(rriMainnet.name).toBe(name)
		expect(isResourceIdentifier(rriMainnet)).toBe(true)
		expect(isResourceIdentifier('not_an_rri_just_a_string')).toBe(false)
		expect(rriMainnet.toString()).toBe('foo_rr1qycfr7ap')

		const rriBetanet = ResourceIdentifier.systemRRIForNetwork({
			name,
			network: NetworkT.BETANET,
		})._unsafeUnwrap()

		expect(rriBetanet.equals(rriMainnet)).toBe(false)
		expect(rriBetanet.toString()).toBe('foo_rb1qy3q706k')
		expect(rriBetanet.network).not.toBe(rriMainnet.network)
	})

	describe('rri from publicKey and name', () => {
		type Vector = {
			pkScalar: number
			name: string
			expectedRRI: string
			network: NetworkT
		}
		const privateKeyAndNameToRri: Vector[] = [
			{
				pkScalar: 1,
				name: 'foo',
				expectedRRI:
					'foo_rb1qv9ee5j4qun9frqj2mcg79maqq55n46u5ypn2j0g9c3q32j6y3',
				network: NetworkT.BETANET,
			},
			{
				pkScalar: 1,
				name: 'bar',
				expectedRRI:
					'bar_rb1qwaa87cznx0nmeq08dya2ae43u92g4g0nkfktd9u9lpq6hgjca',
				network: NetworkT.BETANET,
			},
			{
				pkScalar: 2,
				name: 'foo',
				expectedRRI:
					'foo_rb1qvmf6ak360gxjfhxeh0x5tn99gjzzh5d7u3kvktj26rsu5qa3u',
				network: NetworkT.BETANET,
			},
			{
				pkScalar: 2,
				name: 'bar',
				expectedRRI:
					'bar_rb1qd3t7gnvwxddj2wxg5dl4adr7er9uw62g7x0ku6hyw4qfk0pfz',
				network: NetworkT.BETANET,
			},
		]

		const doTest = (vector: Vector, index: number): void => {
			it(`vector_index${index}`, () => {
				const publicKey = PrivateKey.fromScalar(
					UInt256.valueOf(vector.pkScalar),
				)
					._unsafeUnwrap()
					.publicKey()

				const rri = ResourceIdentifier.fromPublicKeyAndNameAndNetwork({
					publicKey,
					name: vector.name,
					network: vector.network,
				})._unsafeUnwrap()

				expect(rri.name).toBe(vector.name)
				expect(rri.network).toBe(vector.network)
				expect(rri.toString()).toBe(vector.expectedRRI)
			})
		}

		privateKeyAndNameToRri.forEach((v, i) => doTest(v, i))
	})

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
			network: NetworkT
		}
		const privateKeyAndNameToRri: SystemRRIVector[] = [
			{
				name: 'xrd',
				expectedRRI: 'xrd_rb1qya85pwq',
				network: NetworkT.BETANET,
			},
			{
				name: 'foo',
				expectedRRI: 'foo_rb1qy3q706k',
				network: NetworkT.BETANET,
			},
			{
				name: 'bar',
				expectedRRI: 'bar_rb1qy6gq5vc',
				network: NetworkT.BETANET,
			},
			{
				name: 'alex',
				expectedRRI: 'alex_rb1qy7s58lc',
				network: NetworkT.BETANET,
			},
			{
				name: 'gold',
				expectedRRI: 'gold_rb1qydtpdac',
				network: NetworkT.BETANET,
			},
			{
				name: 'btcrw',
				expectedRRI: 'btcrw_rb1qyerpvjk',
				network: NetworkT.BETANET,
			},
			{
				name: 'ethrw',
				expectedRRI: 'ethrw_rb1qyeev2v5',
				network: NetworkT.BETANET,
			},
		]

		const doTest = (vector: SystemRRIVector, index: number): void => {
			it(`vector_index${index}`, () => {
				const rri = ResourceIdentifier.systemRRIForNetwork({
					name: vector.name,
					network: vector.network,
				})._unsafeUnwrap()

				expect(rri.name).toBe(vector.name)
				expect(rri.network).toBe(vector.network)
				expect(rri.toString()).toBe(vector.expectedRRI)
			})
		}
		privateKeyAndNameToRri.forEach((v, i) => doTest(v, i))
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

		it('rri checksum invalid bech32 string', () => {
			const rri = 'xrd_rb1qya85pw1' // "w1" should have been "wq";
			ResourceIdentifier.fromUnsafe(rri).match(
				_ => {
					throw new Error('Expected error but got none')
				},
				e => {
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
					_ => {
						throw new Error(
							`Got success, but expected failure, rri: ${invalidVector.invalidRRI}`,
						)
					},
					e => {
						expect(msgFromError(e).length).toBeGreaterThan(1)
					},
				)
			})
		}
		invalidVectors.forEach((v, i) => doTest(v, i))
	})
})

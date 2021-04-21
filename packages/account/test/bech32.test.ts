import { Bech32 } from '../src/bech32'
import { publicKeyFromBytes } from '@radixdlt/crypto'
import { ValidatorAddress } from '../src'
import { msgFromError } from '@radixdlt/util'
import { ResourceIdentifier, ResourceIdentifierT } from '@radixdlt/application'

describe('bech32', () => {
	it('to from bech32 data', () => {
		const plaintext = 'Hello Radix!'
		const bech32DataHex = '09011216181b030f04010906021903090f001010'
		const bech32Data = Buffer.from(bech32DataHex, 'hex')
		const decodedBech32Data = Bech32.convertDataFromBech32(bech32Data)
		expect(decodedBech32Data.toString('utf8')).toBe(plaintext)

		const convertedToBech32Data = Bech32.convertDataToBech32(
			Buffer.from(plaintext, 'utf8'),
		)

		expect(convertedToBech32Data.toString('hex')).toBe(bech32DataHex)
	})

	it('validator address', () => {
		const pubKey = publicKeyFromBytes(
			Buffer.from(
				'030cfcefa07af9dd6dbe770b87d7dbdd2c31ba7f4fcf8f3a1196d502f13561b046',
				'hex',
			),
		)._unsafeUnwrap()

		const validatorAddress = ValidatorAddress.fromPublicKey(pubKey)

		expect(validatorAddress.publicKey.equals(pubKey)).toBe(true)
		expect(validatorAddress.toString()).toBe(
			'vb1qvx0emaq0tua6md7wu9c047mm5krrwnlfl8c7ws3jm2s9uf4vxcyvrwrazy',
		)
	})

	it('legacy rri', () => {
		const rriLegacyStr =
			'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/XRD'
		const rri = ResourceIdentifier.fromString(rriLegacyStr)._unsafeUnwrap()
		expect(rri.toString()).toBe(
			'xrd_rr1qfumuen7l8wthtz45p3ftn58pvrs9xlumvkuu2xet8egzkcklqtesv2yq5l',
		)
	})

	it('can parse validator bech32 string', () => {
		const validatorString = 'vb1qfumuen7l8wthtz45p3ftn58pvrs9xlumvkuu2xet8egzkcklqtes8rfsld'
		ValidatorAddress.fromUnsafe(validatorString).match(
			(decoded) => {
				expect(decoded.publicKey.asData({ compressed: true }).toString('hex')).toBe('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798')
			},
			(error) => { throw error }
		)
	})

	it('rri bech32', () => {
		const doTest = (
			name: string,
			expectedRRI: string,
			hash: Buffer,
		): void => {
			const doTestRRI = (rriToCheck: ResourceIdentifierT): void => {
				expect(rriToCheck.toString()).toBe(expectedRRI)
				expect(rriToCheck.hash.toString('hex')).toBe(
					hash.toString('hex'),
				)
				expect(rriToCheck.name).toBe(name)
			}
			const rri = ResourceIdentifier.create({ hash, name })._unsafeUnwrap()
			doTestRRI(rri)
			const rriFromString = ResourceIdentifier.fromBech32String(
				expectedRRI,
			)._unsafeUnwrap()
			doTestRRI(rriFromString)
			expect(rriFromString.equals(rri)).toBe(true)
		}
		doTest(
			'foobar',
			'foobar_rr1m6kmamckpjzlw',
			Buffer.from('deadbeef', 'hex'),
		)
		doTest(
			'hello',
			'hello_rr1w3jhxar5v4ehguwx8gq',
			Buffer.from('testtest', 'utf8'),
		)
	})

	describe('test non happy paths', () => {
		it('rri checksum invalid bech32 string', () => {
			const bechString = 'hello_rr1w3jhxar5v4ehguwx8g3' // "8g3" should have been "8gq";
			Bech32.decode({ bechString }).match(
				(s) => {
					throw new Error('Expected failure')
				},
				(e) => {
					expect(msgFromError(e)).toBe(
						`Invalid checksum for ${bechString}`,
					)
				},
			)
		})
	})
})

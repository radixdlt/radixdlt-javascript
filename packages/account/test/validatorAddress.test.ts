import { publicKeyFromBytes } from '@radixdlt/crypto'
import { ValidatorAddress } from '../src/validatorAddress'

describe('validator addresses', () => {
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


	it('can parse validator bech32 string', () => {
		const validatorString =
			'vb1qfumuen7l8wthtz45p3ftn58pvrs9xlumvkuu2xet8egzkcklqtes8rfsld'
		ValidatorAddress.fromUnsafe(validatorString).match(
			(decoded) => {
				expect(
					decoded.publicKey
						.asData({ compressed: true })
						.toString('hex'),
				).toBe(
					'0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
				)
			},
			(error) => {
				throw error
			},
		)
	})
})
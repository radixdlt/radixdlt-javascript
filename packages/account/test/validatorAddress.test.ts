import { publicKeyFromBytes } from '@radixdlt/crypto'
import { ValidatorAddress } from '../src'
import { AddressTypeT, NetworkT, ValidatorAddressT } from '../dist'

describe('validator address', () => {

	it('validator address betanet', () => {
		const publicKey = publicKeyFromBytes(
			Buffer.from(
				'030cfcefa07af9dd6dbe770b87d7dbdd2c31ba7f4fcf8f3a1196d502f13561b046',
				'hex',
			),
		)._unsafeUnwrap()

		const validatorAddress = ValidatorAddress.fromPublicKeyAndNetwork({
			publicKey,
		})

		expect(validatorAddress.network).toBe(NetworkT.BETANET)

		expect(validatorAddress.addressType).toBe(AddressTypeT.VALIDATOR)

		expect(validatorAddress.publicKey.equals(publicKey)).toBe(true)
		expect(validatorAddress.toString()).toBe(
			'vb1qvx0emaq0tua6md7wu9c047mm5krrwnlfl8c7ws3jm2s9uf4vxcyvrwrazy',
		)
	})

	it('validator address mainnet', () => {
		const publicKey = publicKeyFromBytes(
			Buffer.from(
				'030cfcefa07af9dd6dbe770b87d7dbdd2c31ba7f4fcf8f3a1196d502f13561b046',
				'hex',
			),
		)._unsafeUnwrap()

		const validatorAddress = ValidatorAddress.fromPublicKeyAndNetwork({
			publicKey,
			network: NetworkT.MAINNET
		})

		expect(validatorAddress.network).toBe(NetworkT.MAINNET)

		expect(validatorAddress.addressType).toBe(AddressTypeT.VALIDATOR)

		expect(validatorAddress.publicKey.equals(publicKey)).toBe(true)
		expect(validatorAddress.toString()).toBe(
			'vr1qvx0emaq0tua6md7wu9c047mm5krrwnlfl8c7ws3jm2s9uf4vxcyvnt062s',
		)
	})

	it('can parse validator bech32 string betanet', () => {
		const validatorString =
			'vb1qfumuen7l8wthtz45p3ftn58pvrs9xlumvkuu2xet8egzkcklqtes8rfsld'
		ValidatorAddress.fromUnsafe(validatorString).match(
			(validatorAddress: ValidatorAddressT) => {
				expect(
					validatorAddress.publicKey
						.asData({ compressed: true })
						.toString('hex'),
				).toBe(
					'0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
				)

				expect(validatorAddress.network).toBe(NetworkT.BETANET)
				expect(validatorAddress.addressType).toBe(AddressTypeT.VALIDATOR)
			},
			(error) => {
				throw error
			},
		)
	})

	it('can parse validator bech32 string mainnet', () => {
		const validatorString =
			'vr1qvx0emaq0tua6md7wu9c047mm5krrwnlfl8c7ws3jm2s9uf4vxcyvnt062s'
		ValidatorAddress.fromUnsafe(validatorString).match(
			(validatorAddress: ValidatorAddressT) => {
				expect(
					validatorAddress.publicKey
						.asData({ compressed: true })
						.toString('hex'),
				).toBe(
					'030cfcefa07af9dd6dbe770b87d7dbdd2c31ba7f4fcf8f3a1196d502f13561b046',
				)

				expect(validatorAddress.network).toBe(NetworkT.MAINNET)
				expect(validatorAddress.addressType).toBe(AddressTypeT.VALIDATOR)
			},
			(error) => {
				throw error
			},
		)
	})
})

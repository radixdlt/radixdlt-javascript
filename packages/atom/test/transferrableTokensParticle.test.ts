import { Address, generatePrivateKey } from '@radixdlt/crypto'
import {
	amountInSmallestDenomination,
	Denomination,
	positiveAmountFromUnsafe,
} from '@radixdlt/primitives'
import { UInt256 } from '@radixdlt/uint256'
import { resourceIdentifierFromAddressAndName } from '../src/resourceIdentifier'
import { transferrableTokensParticle } from '../src/transferrableTokensParticle'
import { transferrableTokensParticleFromUnsafe } from './utility'

describe('transferrableTokensParticle', () => {
	it('can be safely created from safe type', async () => {
		const privateKey = generatePrivateKey()
		const publicKeyResult = await privateKey.derivePublicKey()
		const publicKey = publicKeyResult._unsafeUnwrap()

		const address = Address({
			publicKey: publicKey,
			magicByte: 1,
		})._unsafeUnwrap()

		const granularity = amountInSmallestDenomination(UInt256.valueOf(1))

		const amount = positiveAmountFromUnsafe(
			1,
			Denomination.Atto,
		)._unsafeUnwrap()

		const rri = resourceIdentifierFromAddressAndName({
			address,
			name: 'FOOBAR',
		})

		const ttpResult = transferrableTokensParticle({
			address,
			tokenDefinitionReference: rri,
			granularity: granularity,
			amount: amount,
		})

		expect(ttpResult.isOk())
		const ttp = ttpResult._unsafeUnwrap()
		const tokenPermissions = ttp.permissions
		expect(tokenPermissions.canBeBurned(() => false)).toBe(true)
		expect(tokenPermissions.canBeMinted(() => false)).toBe(true)
	})

	it('cannot be created from an amount not being a multiple of granularity', async () => {
		const privateKey = generatePrivateKey()
		const publicKeyResult = await privateKey.derivePublicKey()
		const publicKey = publicKeyResult._unsafeUnwrap()

		const address = Address({
			publicKey: publicKey,
			magicByte: 1,
		})._unsafeUnwrap()

		const granularityOfThree = amountInSmallestDenomination(
			UInt256.valueOf(3),
		)

		const amount = positiveAmountFromUnsafe(
			2,
			Denomination.Atto,
		)._unsafeUnwrap()

		const rri = resourceIdentifierFromAddressAndName({
			address,
			name: 'FOOBAR',
		})

		const ttpResult = transferrableTokensParticle({
			address,
			tokenDefinitionReference: rri,
			granularity: granularityOfThree,
			amount: amount,
		})

		expect(ttpResult.isErr())
	})

	it('can be unsafely created from primitives', () => {
		const ttp = transferrableTokensParticleFromUnsafe({
			address: '9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
			tokenDefinitionReference:
				'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR',
			granularity: 3,
			amount: 9,
		})._unsafeUnwrap()

		expect(ttp.nonce).toBeTruthy()
		expect(ttp.amount.toString()).toBe('9000000000000000000')
		expect(ttp.granularity.toString()).toBe('3000000000000000000')
	})
})

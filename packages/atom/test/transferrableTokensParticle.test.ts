import {
	Address
} from '@radixdlt/account'
import { generatePrivateKey } from '@radixdlt/crypto'
import { JSONDecodableObject, OutputMode } from '@radixdlt/data-formats'
import { Amount, Denomination, nonce, one, zero } from '@radixdlt/primitives'
import { UInt256 } from '@radixdlt/uint256'
import { TransferrableTokensParticle } from '../src/particles/transferrableTokensParticle'
import { ResourceIdentifier } from '../src/resourceIdentifier'
import { tokenPermissionsAll } from '../src/tokenPermissions'
import { transferrableTokensParticleFromUnsafe } from './helpers/utility'

describe('transferrableTokensParticle', () => {
	it('can be safely created from safe type', () => {
		const privateKey = generatePrivateKey()
		const publicKey = privateKey.publicKey()
		const address = Address.fromPublicKeyAndMagicByte({
			publicKey: publicKey,
			magicByte: 1,
		})
		const granularity = Amount.inSmallestDenomination(UInt256.valueOf(1))
		const amount = Amount.fromUnsafe(1, Denomination.Atto)._unsafeUnwrap()
		const rri = ResourceIdentifier.fromAddressAndName({
			address,
			name: 'FOOBAR',
		})
		const ttpResult = TransferrableTokensParticle.create({
			address,
			resourceIdentifier: rri,
			granularity: granularity,
			amount: amount,
		})

		expect(ttpResult.isOk())
		const ttp = ttpResult._unsafeUnwrap()
		const tokenPermissions = ttp.permissions
		expect(tokenPermissions.canBeBurned(() => false)).toBe(true)
		expect(tokenPermissions.canBeMinted(() => false)).toBe(true)
	})

	it('cannot be created from an amount not being a multiple of granularity', () => {
		const privateKey = generatePrivateKey()
		const publicKey = privateKey.publicKey()
		const address = Address.fromPublicKeyAndMagicByte({
			publicKey: publicKey,
			magicByte: 1,
		})
		const granularityOfThree = Amount.inSmallestDenomination(
			UInt256.valueOf(3),
		)
		const amount = Amount.fromUnsafe(2, Denomination.Atto)._unsafeUnwrap()
		const rri = ResourceIdentifier.fromAddressAndName({
			address,
			name: 'FOOBAR',
		})
		const ttpResult = TransferrableTokensParticle.create({
			address,
			resourceIdentifier: rri,
			granularity: granularityOfThree,
			amount: amount,
		})

		expect(ttpResult.isErr())
	})

	it('can be unsafely created from primitives', () => {
		const ttp = transferrableTokensParticleFromUnsafe({
			address: '9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
			resourceIdentifier:
				'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR',
			granularity: 3,
			amount: 9,
		})._unsafeUnwrap()

		expect(ttp.nonce).toBeTruthy()
		expect(ttp.amount.toString()).toBe('9')
		expect(ttp.granularity.toString()).toBe('3')
	})

	it('should be equal to another ttp', () => {
		const props = {
			address: '9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
			resourceIdentifier:
				'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR',
			granularity: 3,
			amount: 9,
		}

		const ttp = transferrableTokensParticleFromUnsafe({
			...props,
		})._unsafeUnwrap()

		const ttp2 = transferrableTokensParticleFromUnsafe({
			...props,
		})._unsafeUnwrap()

		expect(ttp.equals(ttp2)).toBeTruthy()
	})

	it('should not be equal to a different ttp', () => {
		const props = {
			address: '9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
			resourceIdentifier:
				'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR',
			granularity: 3,
			amount: 9,
		}

		const ttp = transferrableTokensParticleFromUnsafe({
			...props,
		})._unsafeUnwrap()

		const ttp2 = transferrableTokensParticleFromUnsafe({
			...props,
			granularity: 1,
		})._unsafeUnwrap()

		expect(ttp.equals(ttp2)).toBeFalsy()
	})

	it('should be able to create with a zero amount', () => {
		const props = {
			address: '9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
			resourceIdentifier:
				'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR',
			granularity: one,
			amount: zero,
		}

		const ttp = transferrableTokensParticleFromUnsafe({
			...props,
		})._unsafeUnwrap()

		expect(ttp.amount.equals(zero)).toBe(true)
	})

	describe('serialization', () => {
		const address = Address.fromBase58String(
			'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
		)._unsafeUnwrap()
		const rri = ResourceIdentifier.fromAddressAndName({
			address,
			name: 'FOOBAR',
		})
		const permissions = tokenPermissionsAll
		const amount = Amount.fromUnsafe(6, Denomination.Atto)._unsafeUnwrap()
		const granularity = Amount.inSmallestDenomination(UInt256.valueOf(3))
		const nonce_ = nonce(1337)
		const ttp = TransferrableTokensParticle.create({
			address,
			resourceIdentifier: rri,
			amount: amount,
			granularity: granularity,
			permissions: permissions.permissions,
			nonce: nonce_,
		})._unsafeUnwrap()

		it('should be able to DSON encode', () => {
			const dson = ttp.toDSON(OutputMode.ALL)._unsafeUnwrap()
			const expected =
				'bf6761646472657373582704390279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798b1186a1e66616d6f756e7458210500000000000000000000000000000000000000000000000000000000000000066b6772616e756c61726974795821050000000000000000000000000000000000000000000000000000000000000003656e6f6e63651905396b7065726d697373696f6e73bf646275726e63616c6c646d696e7463616c6cff6a73657269616c697a6572782472616469782e7061727469636c65732e7472616e736665727261626c655f746f6b656e737818746f6b656e446566696e6974696f6e5265666572656e6365583d062f3953386b684c485a6136467379476f36333478516f3951774c67534847705848485737363444356d50594263726e665a563652542f464f4f424152ff'
			expect(dson.toString('hex')).toBe(expected)
		})

		it('should be able to JSON encode', () => {
			const json = ttp.toJSON()._unsafeUnwrap()

			const expected = {
				serializer: TransferrableTokensParticle.SERIALIZER,
				tokenDefinitionReference: rri.toJSON()._unsafeUnwrap(),
				granularity: granularity.toJSON()._unsafeUnwrap(),
				permissions: permissions.toJSON()._unsafeUnwrap(),
				nonce: nonce_.toJSON()._unsafeUnwrap(),
				amount: amount.toJSON()._unsafeUnwrap(),
				address: address.toJSON()._unsafeUnwrap(),
			}

			expect(json).toEqual(expected)
		})

		it('should be able to JSON decode', () => {
			const json: JSONDecodableObject = {
				serializer: TransferrableTokensParticle.SERIALIZER,
				resourceIdentifier: rri.toJSON()._unsafeUnwrap(),
				granularity: granularity.toJSON()._unsafeUnwrap(),
				permissions: permissions.toJSON()._unsafeUnwrap(),
				nonce: nonce_.toJSON()._unsafeUnwrap(),
				amount: amount.toJSON()._unsafeUnwrap(),
				address: address.toJSON()._unsafeUnwrap(),
			}

			const result = TransferrableTokensParticle.fromJSON(
				json,
			)._unsafeUnwrap()

			expect(ttp.equals(result)).toBe(true)
		})
	})
})

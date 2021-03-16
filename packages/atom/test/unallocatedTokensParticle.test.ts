import { generatePrivateKey } from '@radixdlt/crypto'
import {
	Address
} from '@radixdlt/account'
import { UInt256 } from '@radixdlt/uint256'
import {
	UnallocatedTokensParticle,
	unallocatedTokensParticle,
} from '../src/particles/unallocatedTokensParticle'
import { unallocatedTokensParticleFromUnsafe } from './helpers/utility'
import { tokenPermissionsAll } from '../src/tokenPermissions'
import { JSONDecodableObject, OutputMode } from '@radixdlt/data-formats'
import { Amount } from '@radixdlt/primitives'
import { ResourceIdentifier } from '../src/_index'
import { nonce } from '@radixdlt/primitives/src/nonce'

describe('unallocatedTokensParticle', () => {
	it('can be safely created from safe type', () => {
		const privateKey = generatePrivateKey()
		const publicKey = privateKey.publicKey()
		const address = Address.fromPublicKeyAndMagicByte({
			publicKey: publicKey,
			magicByte: 1,
		})
		const granularity = Amount.inSmallestDenomination(UInt256.valueOf(1))
		const amount = Amount.inSmallestDenomination(UInt256.valueOf(1))
		const resourceIdentifier = ResourceIdentifier.fromAddressAndName({
			address,
			name: 'FOOBAR',
		})
		const uatp = unallocatedTokensParticle({
			resourceIdentifier: resourceIdentifier,
			granularity: granularity,
			amount: amount,
		})

		const tokenPermissions = uatp.permissions
		expect(tokenPermissions.canBeBurned(() => false)).toBe(true)
		expect(tokenPermissions.canBeMinted(() => false)).toBe(true)
		expect(uatp.nonce).toBeTruthy()
	})

	it('can be unsafely created from primitives', () => {
		const uatp = unallocatedTokensParticleFromUnsafe({
			resourceIdentifier:
				'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR',
			granularity: 3,
			amount: 9,
		})._unsafeUnwrap()

		expect(uatp.nonce).toBeTruthy()
		expect(uatp.amount.toString()).toBe('9')
		expect(uatp.granularity.toString()).toBe('3')
	})

	it('should be equal to another UATP', () => {
		const props = {
			resourceIdentifier:
				'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR',
			granularity: 3,
			amount: 9,
		}
		const uatp = unallocatedTokensParticleFromUnsafe({
			...props,
		})._unsafeUnwrap()

		const uatp2 = unallocatedTokensParticleFromUnsafe({
			...props,
		})._unsafeUnwrap()

		expect(uatp.equals(uatp2)).toBeTruthy()
	})

	it('should not be equal to different UATP', () => {
		const props = {
			resourceIdentifier:
				'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR',
			granularity: 3,
			amount: 9,
		}
		const uatp = unallocatedTokensParticleFromUnsafe({
			...props,
		})._unsafeUnwrap()

		const uatp2 = unallocatedTokensParticleFromUnsafe({
			...props,
			amount: 3,
		})._unsafeUnwrap()

		expect(uatp.equals(uatp2)).toBeFalsy()
	})

	describe('serialization', () => {
		const address = Address.fromBase58String(
			'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
		)._unsafeUnwrap()
		const resourceIdentifier = ResourceIdentifier.fromAddressAndName({
			address,
			name: 'FOOBAR',
		})
		const permissions = tokenPermissionsAll
		const amount = Amount.inSmallestDenomination(UInt256.valueOf(6))
		const granularity = Amount.inSmallestDenomination(UInt256.valueOf(3))
		const nonce_ = nonce(1337)
		const uatp = unallocatedTokensParticle({
			resourceIdentifier: resourceIdentifier,
			amount: amount,
			granularity: granularity,
			permissions: permissions.permissions,
			nonce: nonce_,
		})

		it('should be able to DSON encode', () => {
			const dson = uatp.toDSON(OutputMode.ALL)._unsafeUnwrap()
			const expected =
				'bf66616d6f756e7458210500000000000000000000000000000000000000000000000000000000000000066b6772616e756c61726974795821050000000000000000000000000000000000000000000000000000000000000003656e6f6e63651905396b7065726d697373696f6e73bf646275726e63616c6c646d696e7463616c6cff6a73657269616c697a6572782272616469782e7061727469636c65732e756e616c6c6f63617465645f746f6b656e737818746f6b656e446566696e6974696f6e5265666572656e6365583d062f3953386b684c485a6136467379476f36333478516f3951774c67534847705848485737363444356d50594263726e665a563652542f464f4f424152ff'
			expect(dson.toString('hex')).toBe(expected)
		})

		it('should be able to JSON encode', () => {
			const json = uatp.toJSON()._unsafeUnwrap()

			const expected = {
				serializer: UnallocatedTokensParticle.SERIALIZER,
				tokenDefinitionReference: resourceIdentifier
					.toJSON()
					._unsafeUnwrap(),
				granularity: granularity.toJSON()._unsafeUnwrap(),
				permissions: permissions.toJSON()._unsafeUnwrap(),
				nonce: nonce_.toJSON()._unsafeUnwrap(),
				amount: amount.toJSON()._unsafeUnwrap(),
			}

			expect(json).toEqual(expected)
		})

		it('should be able to JSON decode', () => {
			const json: JSONDecodableObject = {
				serializer: UnallocatedTokensParticle.SERIALIZER,
				resourceIdentifier: resourceIdentifier.toJSON()._unsafeUnwrap(),
				granularity: granularity.toJSON()._unsafeUnwrap(),
				permissions: permissions.toJSON()._unsafeUnwrap(),
				nonce: nonce_.toJSON()._unsafeUnwrap(),
				amount: amount.toJSON()._unsafeUnwrap(),
			}

			const result = UnallocatedTokensParticle.fromJSON(
				json,
			)._unsafeUnwrap()

			expect(uatp.equals(result)).toBe(true)
		})
	})
})

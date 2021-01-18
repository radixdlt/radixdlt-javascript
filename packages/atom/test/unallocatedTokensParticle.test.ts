import { makeAddress, generatePrivateKey } from '@radixdlt/crypto'
import { amountInSmallestDenomination } from '@radixdlt/primitives'
import { UInt256 } from '@radixdlt/uint256'
import { resourceIdentifierFromAddressAndName } from '../src/resourceIdentifier'
import { unallocatedTokensParticle } from '../src/unallocatedTokensParticle'
import { unallocatedTokensParticleFromUnsafe } from './utility'

describe('unallocatedTokensParticle', () => {
	it('can be safely created from safe type', async () => {
		const privateKey = generatePrivateKey()
		const publicKeyResult = await privateKey.derivePublicKey()
		const publicKey = publicKeyResult._unsafeUnwrap()
		const address = makeAddress({
			publicKey: publicKey,
			magicByte: 1,
		})._unsafeUnwrap()
		const granularity = amountInSmallestDenomination(UInt256.valueOf(1))
		const amount = amountInSmallestDenomination(UInt256.valueOf(1))
		const rri = resourceIdentifierFromAddressAndName({
			address,
			name: 'FOOBAR',
		})
		const uatp = unallocatedTokensParticle({
			tokenDefinitionReference: rri,
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
			tokenDefinitionReference:
				'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR',
			granularity: 3,
			amount: 9,
		})._unsafeUnwrap()

		expect(uatp.nonce).toBeTruthy()
		expect(uatp.amount.toString()).toBe('9000000000000000000')
		expect(uatp.granularity.toString()).toBe('3000000000000000000')
	})
})

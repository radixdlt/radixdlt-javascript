import {
	Address,
	addressFromPublicKeyAndMagicByte,
	generatePrivateKey,
} from '@radixdlt/crypto'
import { particle } from '../src/particle'
import { resourceIdentifierFromAddressAndName } from '../src/resourceIdentifier'
import { Particle, ResourceIdentifier } from '../src/_types'
import Long from 'long'

describe('particle', () => {
	let rri: ResourceIdentifier
	let address: Address

	beforeAll(async () => {
		const privateKey = generatePrivateKey()
		const publicKeyResult = await privateKey.derivePublicKey()
		const publicKey = publicKeyResult._unsafeUnwrap()
		address = addressFromPublicKeyAndMagicByte({
			publicKey: publicKey,
			magicByte: 1,
		})
		rri = resourceIdentifierFromAddressAndName({
			address,
			name: 'FOOBAR',
		})
	})

	it('should have a tokenDefinitionReference', () => {
		const newParticle = particle<Particle>({
			tokenDefinitionReference: rri,
		})

		expect(newParticle.tokenDefinitionReference).toEqual(rri)
	})

	it('should have a nonce', () => {
		const newParticle = particle<Particle>({
			tokenDefinitionReference: rri,
		})

		expect(Long.isLong(newParticle.nonce))
	})

	it('should be equal to another particle', () => {
		const particle1 = particle<Particle>({
			tokenDefinitionReference: rri,
		})

		const particle2 = particle<Particle>({
			tokenDefinitionReference: rri,
		})

		expect(particle1.equals(particle2)).toBeTruthy()
	})

	it('should not be equal to a different particle', () => {
		const particle1 = particle<Particle>({
			tokenDefinitionReference: rri,
		})

		const particle2 = particle<Particle>({
			tokenDefinitionReference: resourceIdentifierFromAddressAndName({
				address,
				name: 'BAZ',
			}),
		})

		expect(particle1.equals(particle2)).toBeFalsy()
	})
})

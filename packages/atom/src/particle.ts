import { randomNonce } from '@radixdlt/primitives'
import { Particle, ResourceIdentifier } from './_types'

export type ParticleInput = Readonly<{
	tokenDefinitionReference: ResourceIdentifier
	equals?: (other: any) => boolean
}>

export const particle = <T extends Particle>(input: ParticleInput) => {
	const compose = (withParticle: Particle) =>
		particle({
			...input,
			...withParticle,
		})

	return Object.assign(compose, {
		...input,
		nonce: randomNonce(),
		equals: (otherParticle: T): boolean =>
			otherParticle.tokenDefinitionReference.equals(
				input.tokenDefinitionReference,
			) && input.equals
				? input.equals(otherParticle)
				: true,
	})
}

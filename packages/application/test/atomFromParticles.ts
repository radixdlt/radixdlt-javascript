import {
	AnySpunParticle,
	atom,
	Atom,
	particleGroup,
	ParticleGroup,
	particleGroups,
	Signatures,
	SpunParticles,
} from '@radixdlt/atom'

export const atomWithParticleGroups = (
	input: Readonly<{
		particleGroups: ParticleGroup[]
		signatures?: Signatures
		message?: string
	}>,
): Atom =>
	atom({
		...input,
		particleGroups: particleGroups(input.particleGroups),
	})

export const atomWithParticleGroup = (
	input: Readonly<{
		particleGroup: ParticleGroup
		signatures?: Signatures
		message?: string
	}>,
): Atom =>
	atomWithParticleGroups({
		...input,
		particleGroups: [input.particleGroup],
	})

export const atomWithSpunParticles = (
	input: Readonly<{
		spunParticles: SpunParticles | AnySpunParticle[]
		signatures?: Signatures
		message?: string
	}>,
): Atom =>
	atomWithParticleGroup({
		...input,
		particleGroup: particleGroup(input.spunParticles),
	})

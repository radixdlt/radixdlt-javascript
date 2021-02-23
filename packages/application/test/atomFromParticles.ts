import {
	AnySpunParticle,
	ParticleGroup,
	particleGroups,
	Signatures,
	SpunParticles,
} from '@radixdlt/atom'
import { Atom } from '@radixdlt/atom/src/atom'
import { AtomT, ParticleGroupT } from '@radixdlt/atom/src/_types'

export const atomWithParticleGroups = (
	input: Readonly<{
		particleGroups: ParticleGroupT[]
		signatures?: Signatures
		message?: string
	}>,
): AtomT =>
	Atom.create({
		...input,
		particleGroups: particleGroups(input.particleGroups),
	})

export const atomWithParticleGroup = (
	input: Readonly<{
		particleGroup: ParticleGroupT
		signatures?: Signatures
		message?: string
	}>,
): AtomT =>
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
): AtomT =>
	atomWithParticleGroup({
		...input,
		particleGroup: ParticleGroup.create(input.spunParticles),
	})

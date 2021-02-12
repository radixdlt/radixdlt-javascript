import { ParticleGroup } from './_types'
import { AnySpunParticle, SpunParticles } from './particles/_types'
import { spunParticlesQueryable } from './particles/spunParticleQueryable'
import {
	isSpunParticles,
	spunParticles as makeSpunParticles,
} from './particles/spunParticles'
import { DSONCodable, DSONEncoding } from '@radixdlt/data-formats'

const SERIALIZER = 'radix.particle_group'

const DSON = (spunParticles: SpunParticles): DSONCodable =>
	DSONEncoding(SERIALIZER)({
		particles: spunParticles.spunParticles,
	})

export const particleGroup = (
	spunParticles: SpunParticles | AnySpunParticle[],
): ParticleGroup => {
	const spunParticles_: SpunParticles = isSpunParticles(spunParticles)
		? spunParticles
		: makeSpunParticles(spunParticles)

	return {
		...DSON(spunParticles_),
		spunParticles: spunParticles_,
		...spunParticlesQueryable(spunParticles_.spunParticles),
	}
}

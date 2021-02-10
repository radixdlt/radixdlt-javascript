import { ParticleGroup } from './_types'
import { AnySpunParticle, SpunParticles } from './particles/_types'
import { spunParticlesQueryable } from './particles/spunParticleQueryable'
import { isSpunParticles } from './particles/spunParticles'
import { DSONCodable, DSONEncoding } from '@radixdlt/data-formats'

const SERIALIZER = 'radix.particle_group'

const DSON = (spunParticles: SpunParticles | AnySpunParticle[]): DSONCodable =>
	DSONEncoding(SERIALIZER)({
		particles: isSpunParticles(spunParticles)
			? spunParticles.spunParticles
			: spunParticles,
	})

export const particleGroup = (
	spunParticles: SpunParticles | AnySpunParticle[],
): ParticleGroup => {
	return {
		...DSON(spunParticles),

		spunParticles: spunParticles as SpunParticles,
		...spunParticlesQueryable(
			isSpunParticles(spunParticles)
				? spunParticles.spunParticles
				: spunParticles,
		),
	}
}

import { ParticleGroup } from './_types'
import { AnySpunParticle, SpunParticles } from './particles/_types'
import { spunParticlesQueryable } from './particles/spunParticleQueryable'
import { isSpunParticles } from './particles/spunParticles'

export const particleGroup = (
	spunParticles: SpunParticles | AnySpunParticle[],
): ParticleGroup => {
	return <ParticleGroup>{
		spunParticles,
		...spunParticlesQueryable(
			isSpunParticles(spunParticles)
				? spunParticles.spunParticles
				: spunParticles,
		),
	}
}

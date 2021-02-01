import { ParticleGroup, ParticleGroups } from './_types'
import { AnySpunParticle } from './particles/_types'
import { spunParticlesQueryable } from './particles/spunParticleQueryable'

export const particleGroups = (groups: ParticleGroup[]): ParticleGroups => {
	const particleMatrix: AnySpunParticle[][] = groups.map(
		(g) => g.spunParticles.spunParticles,
	)
	const spunParticles: AnySpunParticle[] = particleMatrix.reduce(
		(accumulator, value) => accumulator.concat(value),
		[],
	)

	return <ParticleGroups>{
		groups,
		...spunParticlesQueryable(spunParticles),
	}
}

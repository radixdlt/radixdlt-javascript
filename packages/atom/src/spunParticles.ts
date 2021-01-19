import {
	DownParticle,
	ParticleType,
	Spin,
	SpunParticle,
	SpunParticleLike,
	SpunParticles,
	UpParticle,
} from './_types'
import { downParticle, upParticle, spunParticle } from './spunParticle'

export const spunParticles = (
	spunParticles: SpunParticleLike[],
): SpunParticles => {
	const unique = Array.from(new Set(spunParticles))

	const particlesOfTypeWithSpin = <Particle extends ParticleType>(query: {
		particleType: string
		spin: Spin
	}): SpunParticle<Particle>[] => {
		return unique
			.filter((sp) => sp.spin === query.spin)
			.filter((sp) => sp.particleType === query.particleType)
			.map((sp) =>
				spunParticle({
					spin: sp.spin,
					particle: sp.particle as Particle,
				}),
			)
	}

	return {
		spunParticles: unique,
		particlesOfTypeWithSpin: particlesOfTypeWithSpin,
		upParticlesOfType: <Particle extends ParticleType>(
			particleType: string,
		): UpParticle<Particle>[] => {
			const spunParticleWithSpinUp: SpunParticle<Particle>[] = particlesOfTypeWithSpin(
				{ particleType: particleType, spin: Spin.UP },
			)
			return spunParticleWithSpinUp.map((sp) => upParticle(sp.particle))
		},
		downParticlesOfType: <Particle extends ParticleType>(
			particleType: string,
		): DownParticle<Particle>[] => {
			const spunParticleWithSpinDown: SpunParticle<Particle>[] = particlesOfTypeWithSpin(
				{ particleType: particleType, spin: Spin.DOWN },
			)
			return spunParticleWithSpinDown.map((sp) =>
				downParticle(sp.particle),
			)
		},
	}
}

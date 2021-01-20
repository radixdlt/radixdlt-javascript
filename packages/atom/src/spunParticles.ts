import {
	AnySpunParticle,
	RadixParticle,
	Spin,
	SpunParticle,
	SpunParticleLike,
	SpunParticles,
} from './_types'
import { anySpunParticle, spunParticle } from './spunParticle'
import { isRadixParticle, RadixParticleType } from './radixParticleTypes'
import { nonNullNonUndefined } from '@radixdlt/util'

/* eslint-disable max-lines-per-function */
export const spunParticles = (
	spunParticles: SpunParticleLike[],
): SpunParticles => {
	const unique = Array.from(new Set(spunParticles))

	const anySpunParticlesOfTypeWithSpin = (query: {
		particleTypes?: RadixParticleType[]
		spin?: Spin
	}): AnySpunParticle[] => {
		if (!query.spin && !query.particleTypes)
			return unique.map(anySpunParticle)

		const spinFilter = (sp: SpunParticleLike): boolean => {
			if (!query.spin) return true
			return sp.spin === query.spin
		}

		return unique
			.filter(spinFilter)
			.filter((sp) => {
				if (!isRadixParticle(sp.particle)) {
					return false
				}
				const radixParticle = sp.particle
				if (!query.particleTypes) return true

				/* eslint-disable max-params */
				const anyParticleTypeMatches = (
					acc: boolean,
					targetType: RadixParticleType,
				): boolean => {
					const matches =
						radixParticle.radixParticleType.valueOf() ===
						targetType.valueOf()
					return acc || matches
				}
				/* eslint-enable max-params */

				return query.particleTypes.reduce(anyParticleTypeMatches, false)
			})
			.map(anySpunParticle)
	}

	const spunParticlesOfTypeWithSpin = <
		Particle extends RadixParticle
	>(query: {
		spin?: Spin
	}): SpunParticle<Particle>[] => {
		const spinFilter = (sp: SpunParticleLike): boolean => {
			if (!query.spin) return true
			return sp.spin === query.spin
		}

		return unique
			.filter(spinFilter)
			.map((sp): SpunParticle<Particle> | undefined => {
				if (!isRadixParticle(sp.particle)) {
					return undefined
				}

				const casted = (sp.particle as Particle).hasAllegedType(
					sp.particle,
				)
				if (casted !== undefined) {
					const particle: Particle = sp.particle as Particle
					return spunParticle({
						spin: sp.spin,
						particle: particle,
					})
				} else {
					return undefined
				}
			})
			.filter(nonNullNonUndefined)
	}

	return {
		spunParticles: unique,
		anySpunParticlesOfTypeWithSpin: anySpunParticlesOfTypeWithSpin,
		spunParticlesOfTypeWithSpin: spunParticlesOfTypeWithSpin,

		// upParticlesOfType: <Particle extends ParticleBase>(
		// 	particleType: string,
		// ): UpParticle<Particle>[] => {
		// 	const spunParticleWithSpinUp: SpunParticle<Particle>[] = particlesOfTypeWithSpin(
		// 		{ particleType: particleType, spin: Spin.UP },
		// 	)
		// 	return spunParticleWithSpinUp.map((sp) => upParticle(sp.particle))
		// },
		// downParticlesOfType: <Particle extends ParticleBase>(
		// 	particleType: string,
		// ): DownParticle<Particle>[] => {
		// 	const spunParticleWithSpinDown: SpunParticle<Particle>[] = particlesOfTypeWithSpin(
		// 		{ particleType: particleType, spin: Spin.DOWN },
		// 	)
		// 	return spunParticleWithSpinDown.map((sp) =>
		// 		downParticle(sp.particle),
		// 	)
		// },
	}
}

import {
	AnySpunParticle,
	RadixParticle,
	Spin,
	SpunParticle,
	SpunParticleLike,
	SpunParticles,
	TransferrableTokensParticle,
	UnallocatedTokensParticle,
} from './_types'
import { anySpunParticle, spunParticle } from './spunParticle'
import {
	isRadixParticle,
	RadixParticleType,
	TransferrableTokensParticleType,
	UnallocatedTokensParticleType,
} from './radixParticleTypes'

/* eslint-disable max-lines-per-function */
export const spunParticles = (
	spunParticles: SpunParticleLike[],
): SpunParticles => {
	const unique = Array.from(new Set(spunParticles))

	const spunParticlesOfTypeWithSpin = <
		Particle extends RadixParticle
	>(query: {
		particleType: RadixParticleType
		spin?: Spin
	}): SpunParticle<Particle>[] => {
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
				return radixParticle.radixParticleType === query.particleType
			})
			.map((sp) => {
				return spunParticle({
					spin: sp.spin,
					particle: sp.particle as Particle,
				})
			})
	}

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
				return query.particleTypes.reduce(
					(acc: boolean, targetType: RadixParticleType): boolean =>
						acc ||
						radixParticle.radixParticleType.valueOf() ===
							targetType.valueOf(),
					false,
				)
				/* eslint-enable max-params */
			})
			.map(anySpunParticle)
	}

	const transferrableTokensParticles = (
		spin?: Spin,
	): SpunParticle<TransferrableTokensParticle>[] =>
		spunParticlesOfTypeWithSpin<TransferrableTokensParticle>({
			spin,
			particleType: TransferrableTokensParticleType,
		})

	const unallocatedTokensParticles = (
		spin?: Spin,
	): SpunParticle<UnallocatedTokensParticle>[] =>
		spunParticlesOfTypeWithSpin<UnallocatedTokensParticle>({
			spin,
			particleType: UnallocatedTokensParticleType,
		})

	return {
		spunParticles: unique,
		anySpunParticlesOfTypeWithSpin: anySpunParticlesOfTypeWithSpin,
		transferrableTokensParticles: transferrableTokensParticles,
		unallocatedTokensParticles: unallocatedTokensParticles,
	}
}

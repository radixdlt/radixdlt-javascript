import {
	AnySpunParticle,
	RadixParticle,
	Spin,
	SpunParticle,
	SpunParticleBase,
	SpunParticles,
	TokenDefinitionParticleBase,
	TransferrableTokensParticle,
	UnallocatedTokensParticle,
} from './_types'
import {
	anySpunParticle,
	isAnySpunParticle,
	spunParticle,
} from './spunParticle'
import {
	isRadixParticle,
	RadixParticleType,
	TransferrableTokensParticleType,
	UnallocatedTokensParticleType,
} from './meta/radixParticleTypes'
import { ResourceIdentifier } from '../_types'

/* eslint-disable max-lines-per-function */
export const spunParticles = (
	spunParticles: AnySpunParticle[],
): SpunParticles => {
	const unique = Array.from(new Set(spunParticles))

	const spunParticlesOfTypeWithSpin = <P extends RadixParticle>(query: {
		particleType: RadixParticleType
		spin?: Spin
	}): SpunParticle<P>[] => {
		const spinFilter = (sp: SpunParticleBase): boolean => {
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
					particle: sp.particle as P,
				})
			})
	}

	const anySpunParticlesOfTypeWithSpin = (query: {
		particleTypes?: RadixParticleType[]
		spin?: Spin
	}): AnySpunParticle[] => {
		if (!query.spin && !query.particleTypes)
			return unique.map(anySpunParticle)

		const spinFilter = (sp: SpunParticleBase): boolean => {
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

	const tokenDefinitionParticleMatchingIdentifier = (
		resourceIdentifier: ResourceIdentifier,
	): TokenDefinitionParticleBase | undefined => {
		const firstTokenDefinitionParticleOfType = (
			particleType: RadixParticleType,
		): TokenDefinitionParticleBase | undefined => {
			const tokenParticles = spunParticlesOfTypeWithSpin<TokenDefinitionParticleBase>(
				{
					particleType: particleType,
				},
			)

			const tokenParticlesMatchingRRI = tokenParticles
				.map((sp) => sp.particle)
				.filter((p) => p.resourceIdentifier.equals(resourceIdentifier))

			return tokenParticlesMatchingRRI.length >= 1
				? tokenParticlesMatchingRRI[0]
				: undefined
		}

		const maybeMutableSupplyTokDefPart = firstTokenDefinitionParticleOfType(
			RadixParticleType.MUTABLE_SUPPLY_TOKEN_DEFINITION,
		)

		if (maybeMutableSupplyTokDefPart) {
			return maybeMutableSupplyTokDefPart
		}

		const maybeFixedSupplyTokDefPart = firstTokenDefinitionParticleOfType(
			RadixParticleType.FIXED_SUPPLY_TOKEN_DEFINITION,
		)

		if (maybeFixedSupplyTokDefPart) {
			return maybeFixedSupplyTokDefPart
		}
		return undefined
	}

	return {
		spunParticles: unique,
		anySpunParticlesOfTypeWithSpin: anySpunParticlesOfTypeWithSpin,
		transferrableTokensParticles: transferrableTokensParticles,
		unallocatedTokensParticles: unallocatedTokensParticles,
		tokenDefinitionParticleMatchingIdentifier: tokenDefinitionParticleMatchingIdentifier,
	}
}

// eslint-disable-next-line complexity
export const isSpunParticles = (
	something: unknown,
): something is SpunParticles => {
	const inspection = something as SpunParticles
	if (
		!(
			inspection.spunParticles !== undefined &&
			inspection.anySpunParticlesOfTypeWithSpin !== undefined
		)
	)
		return false
	return inspection.spunParticles.reduce(
		// eslint-disable-next-line max-params
		(acc: boolean, element: AnySpunParticle) =>
			acc || isAnySpunParticle(element) === true,
		false,
	)
}

import {
	AnySpunParticle,
	RadixParticle,
	Spin,
	SpunParticle,
	SpunParticleBase,
	SpunParticleQueryable,
	TokenDefinitionParticleBase,
	UnallocatedTokensParticle,
} from './_types'
import { isRadixParticle, RadixParticleType } from './meta/radixParticleTypes'
import { anySpunParticle, spunParticle } from './spunParticle'
import { ResourceIdentifier } from '../_types'

const spunParticlesOfTypeWithSpin = <P extends RadixParticle>(query: {
	unique: AnySpunParticle[]
	particleType: RadixParticleType
	spin?: Spin
}): SpunParticle<P>[] => {
	const spinFilter = (sp: SpunParticleBase): boolean => {
		if (!query.spin) return true
		return sp.spin === query.spin
	}

	return query.unique
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

const tokenDefinitionParticleMatchingIdentifier = (
	query: Readonly<{
		unique: AnySpunParticle[]
		resourceIdentifier: ResourceIdentifier
	}>,
): TokenDefinitionParticleBase | undefined => {
	const firstTokenDefinitionParticleOfType = (
		particleType: RadixParticleType,
	): TokenDefinitionParticleBase | undefined => {
		const tokenParticles = spunParticlesOfTypeWithSpin<TokenDefinitionParticleBase>(
			{
				unique: query.unique,
				particleType: particleType,
			},
		)

		const tokenParticlesMatchingRRI = tokenParticles
			.map((sp) => sp.particle)
			.filter((p) =>
				p.resourceIdentifier.equals(query.resourceIdentifier),
			)

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

const anySpunParticlesOfTypeWithSpin = (query: {
	unique: AnySpunParticle[]
	particleTypes?: RadixParticleType[]
	spin?: Spin
}): AnySpunParticle[] => {
	if (!query.spin && !query.particleTypes)
		return query.unique.map(anySpunParticle)

	const spinFilter = (sp: SpunParticleBase): boolean => {
		if (!query.spin) return true
		return sp.spin === query.spin
	}

	return query.unique
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

export const spunParticlesQueryable = (
	anySpunParticles: AnySpunParticle[],
): SpunParticleQueryable => {
	const unique = Array.from(new Set(anySpunParticles))

	return <SpunParticleQueryable>{
		anySpunParticlesOfTypeWithSpin: (query) =>
			anySpunParticlesOfTypeWithSpin({ unique, ...query }),
		transferrableTokensParticles: (spin?: Spin) =>
			spunParticlesOfTypeWithSpin<UnallocatedTokensParticle>({
				spin,
				unique,
				particleType: RadixParticleType.TRANSFERRABLE_TOKENS,
			}),
		unallocatedTokensParticles: (spin?: Spin) =>
			spunParticlesOfTypeWithSpin<UnallocatedTokensParticle>({
				spin,
				unique,
				particleType: RadixParticleType.UNALLOCATED_TOKENS,
			}),
		tokenDefinitionParticleMatchingIdentifier: (
			resourceIdentifier: ResourceIdentifier,
		) =>
			tokenDefinitionParticleMatchingIdentifier({
				resourceIdentifier,
				unique,
			}),
	}
}

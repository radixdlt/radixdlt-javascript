import { AnySpunParticle, SpunParticles } from './_types'
import { isAnySpunParticle } from './spunParticle'
import { spunParticlesQueryable } from './spunParticleQueryable'

/* eslint-disable */
export const spunParticles = (
	spunParticles: AnySpunParticle[],
): SpunParticles => {
	const unique = Array.from(new Set(spunParticles))

	return {
		spunParticles: unique,
		...spunParticlesQueryable(unique),
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

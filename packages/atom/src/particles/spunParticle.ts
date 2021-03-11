import {
	AnyDownParticle,
	AnySpunParticle,
	AnyUpParticle,
	DownParticle,
	ParticleBase,
	Spin,
	SpunParticleT,
	SpunParticleBase,
	UpParticle,
} from './_types'

import { isSpin } from './meta/spin'

import { err, ok, Result } from 'neverthrow'
import {
	DSONEncoding,
	DSONPrimitive,
	JSONEncoding,
	taggedObjectDecoder,
} from '@radixdlt/data-formats'
import { SERIALIZER_KEY } from '../_types'
import { JSONDecoding } from '../utils'

const SERIALIZER = 'radix.spun_particle'

const JSONDecoder = taggedObjectDecoder(
	SERIALIZER,
	SERIALIZER_KEY,
)((input: SpunParticleBase) => ok(anySpunParticle(input)))

const jsonDecoding = JSONDecoding.withDecoders(JSONDecoder).create<
	SpunParticleT<any>
>()

/* eslint-disable max-params */

const anySpunParticlesEquals = (
	lhs: SpunParticleBase,
	rhs: SpunParticleBase,
): boolean => {
	return (
		lhs.spin === rhs.spin &&
		lhs.particle.equals(rhs.particle) &&
		rhs.particle.equals(lhs.particle)
	)
}
/* eslint-enable max-params */

/**
 * Creates an AnySpunParticle (type-erased SpunParticle) with a specified spin.
 *
 * @param spunParticleBase {SpunParticleBase} A particle of any type of to give a spin.
 * @returns {AnySpunParticle} an AnySpunParticle (type-erased SpunParticle) with a specified spin.
 */
export const anySpunParticle = (
	spunParticleBase: SpunParticleBase,
): AnySpunParticle => ({
	...spunParticleBase,

	...JSONEncoding(SERIALIZER)({
		particle: spunParticleBase.particle,
		spin: spunParticleBase.spin,
	}),

	...DSONEncoding(SERIALIZER)({
		particle: spunParticleBase.particle,
		spin: DSONPrimitive(spunParticleBase.spin),
	}),

	equals: (other: SpunParticleBase): boolean =>
		anySpunParticlesEquals(spunParticleBase, other),
	downedAsAny: (): Result<AnyDownParticle, Error> =>
		spunParticleBase.spin === Spin.UP
			? ok(anyDownParticle(spunParticleBase.particle))
			: err(new Error('Cannot down a particle with spin Down')),
})

/**
 * Creates a typed SpunParticle with a specified spin.
 *
 * @param particle {P} A particle of typed type `P` to give a spin.
 * @param spin {Spin} The spun of the particle
 * @returns {SpunParticleT<P>} a typed SpunParticle with a specified spin.
 * @template P a specific type of particle, that **is a** `ParticleBase`
 */
export const spunParticle = <P extends ParticleBase>(
	input: Readonly<{
		spin: Spin
		particle: P
	}>,
): SpunParticleT<P> => {
	const anySpun = anySpunParticle(input)

	return {
		...anySpun,

		particle: input.particle,
		eraseToAny: () => anySpun,
		downed: (): Result<DownParticle<P>, Error> =>
			input.spin === Spin.UP
				? ok(downParticle(input.particle))
				: err(new Error('Cannot down a particle with spin Down')),
	}
}

/**
 * Creates a typed UpParticle, a container for typed particle with the at compile time known Spin.UP.
 *
 * @param particle {P} A particle of typed type `P` to give the spin UP.
 * @returns {UpParticle<P>} a typed UpParticle, a container for typed particle with the at compile time known Spin.UP.
 * @template P a specific type of particle, that **is a** `ParticleBase`
 */
export const upParticle = <P extends ParticleBase>(
	particle: P,
): UpParticle<P> => {
	const spin = Spin.UP
	const spun = spunParticle({ particle, spin })
	return {
		...spun,
		spin,
		toSpunParticle: () => spun,
		eraseToAnyUp: () => anyUpParticle(particle),
	}
}

/**
 * Creates a typed DownParticle, a container for typed particle with the at compile time known Spin.Down.
 *
 * @param particle {P} A particle of typed type `P` to give the spin DOWN.
 * @returns {DownParticle<P>} a typed DownParticle, a container for typed particle with the at compile time known Spin.Down.
 * @template P a specific type of particle, that **is a** `ParticleBase`
 */
export const downParticle = <P extends ParticleBase>(
	particle: P,
): DownParticle<P> => {
	const spin = Spin.DOWN
	const spun = spunParticle({ particle, spin })
	return {
		...spun,
		spin,
		toSpunParticle: () => spun,
		eraseToAnyDown: () => anyDownParticle(particle),
	}
}

/**
 * Creates a typed SpunParticle with Spin.UP.
 *
 * @param particle {P} A particle of typed type `P` to give the spin UP.
 * @returns {SpunParticleT<P>} a typed SpunParticle with a spin UP.
 * @template P a specific type of particle, that **is a** `ParticleBase`
 */
export const spunUpParticle = <P extends ParticleBase>(
	particle: P,
): SpunParticleT<P> => upParticle(particle).toSpunParticle()

/**
 * Creates a typed SpunParticle with Spin.DOWN.
 *
 * @param particle {P} A particle of typed type `P` to give the spin DOWN.
 * @returns {SpunParticleT<P>} a typed SpunParticle with a spin DOWN.
 * @template P a specific type of particle, that **is a** `ParticleBase`
 */
export const spunDownParticle = <P extends ParticleBase>(
	particle: P,
): SpunParticleT<P> => downParticle(particle).toSpunParticle()

/**
 * Creates an AnyUpParticle (type-erased UpParticle) with the at compile time known spin UP.
 *
 * @param particle {ParticleBase} A particle of any type of to give the spin UP.
 * @returns {AnyUpParticle} an AnyUpParticle (type-erased UpParticle) with the at compile time known spin UP.
 */
export const anyUpParticle = (particle: ParticleBase): AnyUpParticle => {
	const spin = Spin.UP
	const anySpun = anySpunParticle({ particle, spin })
	return {
		...anySpun,
		spin,
		toAnySpunParticle: () => anySpun,
	}
}

/**
 * Creates an AnyDownParticle (type-erased DownParticle) with the at compile time known spin DOWN.
 *
 * @param particle {ParticleBase} A particle of any type of to give the spin DOWN.
 * @returns {AnyDownParticle} an AnyDownParticle (type-erased DownParticle) with the at compile time known spin DOWN.
 */
export const anyDownParticle = (particle: ParticleBase): AnyDownParticle => {
	const spin = Spin.DOWN
	const anySpun = anySpunParticle({ particle, spin })
	return {
		...anySpun,
		spin,
		toAnySpunParticle: () => anySpun,
	}
}

export const asAnyUpParticle = (
	spunParticle: SpunParticleBase,
): Result<AnyUpParticle, Error> => {
	if (spunParticle.spin !== Spin.UP) {
		return err(new Error('Particle does not have spin UP.'))
	}
	return ok(anyUpParticle(spunParticle.particle))
}

export const asAnyDownParticle = (
	spunParticle: SpunParticleBase,
): Result<AnyDownParticle, Error> => {
	if (spunParticle.spin !== Spin.DOWN) {
		return err(new Error('Particle does not have spin DOWN.'))
	}
	return ok(anyDownParticle(spunParticle.particle))
}

export const asUpParticle = <P extends ParticleBase>(
	spunParticle: SpunParticleT<P>,
): Result<UpParticle<P>, Error> => {
	if (spunParticle.spin !== Spin.UP) {
		return err(new Error('Particle does not have spin UP.'))
	}
	return ok(upParticle(spunParticle.particle))
}

export const asDownParticle = <P extends ParticleBase>(
	spunParticle: SpunParticleT<P>,
): Result<DownParticle<P>, Error> => {
	if (spunParticle.spin !== Spin.DOWN) {
		return err(new Error('Particle does not have spin DOWN.'))
	}
	return ok(downParticle(spunParticle.particle))
}

const isParticleBase = (something: unknown): something is ParticleBase => {
	const inspection = something as ParticleBase
	return inspection.equals !== undefined
}

// eslint-disable-next-line complexity
export const isAnySpunParticle = (
	something: unknown,
): something is AnySpunParticle => {
	const inspection = something as AnySpunParticle
	return (
		inspection.spin !== undefined &&
		isSpin(inspection.spin) &&
		inspection.particle !== undefined &&
		isParticleBase(inspection.particle) &&
		inspection.equals !== undefined &&
		inspection.downedAsAny() !== undefined
	)
}

export const SpunParticle = {
	...jsonDecoding,
	JSONDecoder,
	SERIALIZER,
}

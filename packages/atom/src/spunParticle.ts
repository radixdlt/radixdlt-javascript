import {
	ParticleBase,
	Spin,
	SpunParticle,
	AnySpunParticle,
	UpParticle,
	DownParticle,
	AnyUpParticle,
	AnyDownParticle,
	SpunParticleLike,
} from './_types'
import { Result, err, ok } from 'neverthrow'

export type SpunParticleSimple = Readonly<{
	spin: Spin
	particle: ParticleBase
}>

/* eslint-disable max-params */
const spunParticlesEquals = (
	lhs: SpunParticleSimple,
	rhs: SpunParticleLike,
): boolean => {
	return (
		lhs.spin === rhs.spin &&
		lhs.particle.equals(rhs.particle) &&
		rhs.particle.equals(lhs.particle)
	)
}
/* eslint-enable max-params */

/**
 * Creates a typed SpunParticle with a specified spin.
 *
 * @param particle {Particle} A particle of typed type `Particle` to give a spin.
 * @param spin {Spin} The spun of the particle
 * @returns {SpunParticle<Particle>} a typed SpunParticle with a specified spin.
 * @template Particle a specific type of particle, that **is a** `ParticleBase`
 */
export const spunParticle = <Particle extends ParticleBase>(
	input: Readonly<{
		spin: Spin
		particle: Particle
	}>,
): SpunParticle<Particle> => ({
	spin: input.spin,
	particle: input.particle,
	eraseToAny: () => anySpunParticle(input),
	equals: (other: SpunParticleLike): boolean =>
		spunParticlesEquals(input, other),
	downed: (): Result<DownParticle<Particle>, Error> =>
		input.spin === Spin.UP
			? ok(downParticle(input.particle))
			: err(new Error('Cannot down a particle with spin Down')),
})

/**
 * Creates a typed SpunParticle with Spin.UP.
 *
 * @param particle {Particle} A particle of typed type `Particle` to give the spin UP.
 * @returns {SpunParticle<Particle>} a typed SpunParticle with a spin UP.
 * @template Particle a specific type of particle, that **is a** `ParticleBase`
 */
export const spunUpParticle = <Particle extends ParticleBase>(
	particle: Particle,
): SpunParticle<Particle> =>
	spunParticle({
		spin: Spin.UP,
		particle: particle,
	})

/**
 * Creates a typed SpunParticle with Spin.DOWN.
 *
 * @param particle {Particle} A particle of typed type `Particle` to give the spin DOWN.
 * @returns {SpunParticle<Particle>} a typed SpunParticle with a spin DOWN.
 * @template Particle a specific type of particle, that **is a** `ParticleBase`
 */
export const spunDownParticle = <Particle extends ParticleBase>(
	particle: Particle,
): SpunParticle<Particle> =>
	spunParticle({
		spin: Spin.DOWN,
		particle: particle,
	})

/**
 * Creates an AnySpunParticle (type-erased SpunParticle) with a specified spin.
 *
 * @param particle {ParticleBase} A particle of any type of to give a spin.
 * @param spin {Spin} The spun of the particle
 * @returns {AnySpunParticle} an AnySpunParticle (type-erased SpunParticle) with a specified spin.
 */
export const anySpunParticle = (
	input: Readonly<{
		spin: Spin
		particle: ParticleBase
	}>,
): AnySpunParticle => ({
	spin: input.spin,
	particle: input.particle,
	equals: (other: SpunParticleLike): boolean =>
		spunParticlesEquals(input, other),
	downed: (): Result<AnyDownParticle, Error> =>
		input.spin === Spin.UP
			? ok(anyDownParticle(input.particle))
			: err(new Error('Cannot down a particle with spin Down')),
})

/**
 * Creates a typed UpParticle, a container for typed particle with the at compile time known Spin.UP.
 *
 * @param particle {Particle} A particle of typed type `Particle` to give the spin UP.
 * @returns {UpParticle<Particle>} a typed UpParticle, a container for typed particle with the at compile time known Spin.UP.
 * @template Particle a specific type of particle, that **is a** `ParticleBase`
 */
export const upParticle = <Particle extends ParticleBase>(
	particle: Particle,
): UpParticle<Particle> => {
	const base = {
		spin: Spin.UP,
		particle: particle,
	}
	return {
		spin: Spin.UP,
		particle: particle,
		toSpunParticle: (): SpunParticle<Particle> => spunParticle(base),
		equals: (other: SpunParticleLike): boolean =>
			spunParticlesEquals(base, other),
		eraseToAny: () => anyUpParticle(particle),
	}
}

/**
 * Creates a typed DownParticle, a container for typed particle with the at compile time known Spin.Down.
 *
 * @param particle {Particle} A particle of typed type `Particle` to give the spin DOWN.
 * @returns {DownParticle<Particle>} a typed DownParticle, a container for typed particle with the at compile time known Spin.Down.
 * @template Particle a specific type of particle, that **is a** `ParticleBase`
 */
export const downParticle = <Particle extends ParticleBase>(
	particle: Particle,
): DownParticle<Particle> => {
	const base = {
		spin: Spin.DOWN,
		particle: particle,
	}
	return {
		spin: Spin.DOWN,
		particle: particle,
		toSpunParticle: (): SpunParticle<Particle> => spunParticle(base),
		equals: (other: SpunParticleLike): boolean =>
			spunParticlesEquals(base, other),
		eraseToAny: () => anyDownParticle(particle),
	}
}

/**
 * Creates an AnyUpParticle (type-erased UpParticle) with the at compile time known spin UP.
 *
 * @param particle {ParticleBase} A particle of any type of to give the spin UP.
 * @returns {AnyUpParticle} an AnyUpParticle (type-erased UpParticle) with the at compile time known spin UP.
 */
export const anyUpParticle = (particle: ParticleBase): AnyUpParticle => {
	const base = {
		spin: Spin.UP,
		particle: particle,
	}
	return {
		spin: Spin.UP,
		particle: particle,
		toAnySpunParticle: () => anySpunParticle(base),
		equals: (other: SpunParticleLike): boolean =>
			spunParticlesEquals(base, other),
	}
}

/**
 * Creates an AnyDownParticle (type-erased DownParticle) with the at compile time known spin DOWN.
 *
 * @param particle {ParticleBase} A particle of any type of to give the spin DOWN.
 * @returns {AnyDownParticle} an AnyDownParticle (type-erased DownParticle) with the at compile time known spin DOWN.
 */
export const anyDownParticle = (particle: ParticleBase): AnyDownParticle => {
	const base = {
		spin: Spin.DOWN,
		particle: particle,
	}
	return {
		spin: Spin.DOWN,
		particle: particle,
		toAnySpunParticle: () => anySpunParticle(base),
		equals: (other: SpunParticleLike): boolean =>
			spunParticlesEquals(base, other),
	}
}

export const asAnyUpParticle = (
	spunParticle: SpunParticleLike,
): Result<AnyUpParticle, Error> => {
	if (spunParticle.spin !== Spin.UP) {
		return err(new Error('Particle does not have spin UP.'))
	}
	return ok(anyUpParticle(spunParticle.particle))
}

export const asAnyDownParticle = (
	spunParticle: SpunParticleLike,
): Result<AnyDownParticle, Error> => {
	if (spunParticle.spin !== Spin.DOWN) {
		return err(new Error('Particle does not have spin DOWN.'))
	}
	return ok(anyDownParticle(spunParticle.particle))
}

export const asUpParticle = <Particle extends ParticleBase>(
	spunParticle: SpunParticle<Particle>,
): Result<UpParticle<Particle>, Error> => {
	if (spunParticle.spin !== Spin.UP) {
		return err(new Error('Particle does not have spin UP.'))
	}
	return ok(upParticle(spunParticle.particle))
}

export const asDownParticle = <Particle extends ParticleBase>(
	spunParticle: SpunParticle<Particle>,
): Result<DownParticle<Particle>, Error> => {
	if (spunParticle.spin !== Spin.DOWN) {
		return err(new Error('Particle does not have spin DOWN.'))
	}
	return ok(downParticle(spunParticle.particle))
}

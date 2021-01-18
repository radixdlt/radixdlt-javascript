import {
	ParticleType,
	Spin,
	SpunParticle,
	AnySpunParticle,
	UpParticle,
	DownParticle,
	AnyUpParticle,
	AnyDownParticle,
} from './_types'
import { Result, err, ok } from 'neverthrow'

/**
 * Creates a typed SpunParticle with a specified spin.
 *
 * @param particle {Particle} A particle of typed type `Particle` to give a spin.
 * @param spin {Spin} The spun of the particle
 * @returns {SpunParticle<Particle>} a typed SpunParticle with a specified spin.
 * @template Particle a specific type of particle, that **is a** `ParticleType`
 */
export const spunParticle = <Particle extends ParticleType>(
	input: Readonly<{
		spin: Spin
		particle: Particle
	}>,
): SpunParticle<Particle> => ({
	spin: input.spin,
	particle: input.particle,
	particleType: input.particle.particleType,
	eraseToAny: () => anySpunParticle(input),
	downed: (): Result<DownParticle<Particle>, Error> =>
		input.spin === Spin.UP
			? ok({
					spin: Spin.DOWN,
					particle: input.particle,
					particleType: input.particle.particleType,
					eraseToAny: () => anyDownParticle(input.particle),
			  })
			: err(new Error('Cannot down a particle with spin Down')),
})

/**
 * Creates a typed SpunParticle with Spin.UP.
 *
 * @param particle {Particle} A particle of typed type `Particle` to give the spin UP.
 * @returns {SpunParticle<Particle>} a typed SpunParticle with a spin UP.
 * @template Particle a specific type of particle, that **is a** `ParticleType`
 */
export const spunUpParticle = <Particle extends ParticleType>(
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
 * @template Particle a specific type of particle, that **is a** `ParticleType`
 */
export const spunDownParticle = <Particle extends ParticleType>(
	particle: Particle,
): SpunParticle<Particle> =>
	spunParticle({
		spin: Spin.DOWN,
		particle: particle,
	})

/**
 * Creates an AnySpunParticle (type-erased SpunParticle) with a specified spin.
 *
 * @param particle {ParticleType} A particle of any type of to give a spin.
 * @param spin {Spin} The spun of the particle
 * @returns {AnySpunParticle} an AnySpunParticle (type-erased SpunParticle) with a specified spin.
 */
export const anySpunParticle = (
	input: Readonly<{
		spin: Spin
		particle: ParticleType
	}>,
): AnySpunParticle => ({
	spin: input.spin,
	particle: input.particle,
	particleType: input.particle.particleType,
	downed: (): Result<AnyDownParticle, Error> =>
		input.spin === Spin.UP
			? ok({
					spin: Spin.DOWN,
					particle: input.particle,
					particleType: input.particle.particleType,
			  })
			: err(new Error('Cannot down a particle with spin Down')),
})

/**
 * Creates a typed UpParticle, a container for typed particle with the at compile time known Spin.UP.
 *
 * @param particle {Particle} A particle of typed type `Particle` to give the spin UP.
 * @returns {UpParticle<Particle>} a typed UpParticle, a container for typed particle with the at compile time known Spin.UP.
 * @template Particle a specific type of particle, that **is a** `ParticleType`
 */
export const upParticle = <Particle extends ParticleType>(
	particle: Particle,
): UpParticle<Particle> => ({
	spin: Spin.UP,
	particle: particle,
	particleType: particle.particleType,
	eraseToAny: () => anyUpParticle(particle),
})

/**
 * Creates a typed DownParticle, a container for typed particle with the at compile time known Spin.Down.
 *
 * @param particle {Particle} A particle of typed type `Particle` to give the spin DOWN.
 * @returns {DownParticle<Particle>} a typed DownParticle, a container for typed particle with the at compile time known Spin.Down.
 * @template Particle a specific type of particle, that **is a** `ParticleType`
 */
export const downParticle = <Particle extends ParticleType>(
	particle: Particle,
): DownParticle<Particle> => ({
	spin: Spin.DOWN,
	particle: particle,
	particleType: particle.particleType,
	eraseToAny: () => anyDownParticle(particle),
})

/**
 * Creates an AnyUpParticle (type-erased UpParticle) with the at compile time known spin UP.
 *
 * @param particle {ParticleType} A particle of any type of to give the spin UP.
 * @returns {AnyUpParticle} an AnyUpParticle (type-erased UpParticle) with the at compile time known spin UP.
 */
export const anyUpParticle = (particle: ParticleType): AnyUpParticle => ({
	spin: Spin.UP,
	particle: particle,
	particleType: particle.particleType,
})

/**
 * Creates an AnyDownParticle (type-erased DownParticle) with the at compile time known spin DOWN.
 *
 * @param particle {ParticleType} A particle of any type of to give the spin DOWN.
 * @returns {AnyDownParticle} an AnyDownParticle (type-erased DownParticle) with the at compile time known spin DOWN.
 */
export const anyDownParticle = (particle: ParticleType): AnyDownParticle => ({
	spin: Spin.DOWN,
	particle: particle,
	particleType: particle.particleType,
})

export const asAnyUpParticle = (
	anySpunParticle: AnySpunParticle,
): Result<AnyUpParticle, Error> => {
	if (anySpunParticle.spin !== Spin.UP) {
		return err(new Error('Particle does not have spin UP.'))
	}
	return ok(anyUpParticle(anySpunParticle.particle))
}

export const asAnyDownParticle = (
	anySpunParticle: AnySpunParticle,
): Result<AnyDownParticle, Error> => {
	if (anySpunParticle.spin !== Spin.DOWN) {
		return err(new Error('Particle does not have spin DOWN.'))
	}
	return ok(anyDownParticle(anySpunParticle.particle))
}

export const asUpParticle = <Particle extends ParticleType>(
	spunParticle: SpunParticle<Particle>,
): Result<UpParticle<Particle>, Error> => {
	if (spunParticle.spin !== Spin.UP) {
		return err(new Error('Particle does not have spin UP.'))
	}
	return ok(upParticle(spunParticle.particle))
}

export const asDownParticle = <Particle extends ParticleType>(
	spunParticle: SpunParticle<Particle>,
): Result<DownParticle<Particle>, Error> => {
	if (spunParticle.spin !== Spin.DOWN) {
		return err(new Error('Particle does not have spin DOWN.'))
	}
	return ok(downParticle(spunParticle.particle))
}

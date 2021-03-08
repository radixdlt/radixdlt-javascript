import { ParticleGroupT, SERIALIZER_KEY } from './_types'
import { AnySpunParticle, SpunParticles } from './particles/_types'
import { spunParticlesQueryable } from './particles/spunParticleQueryable'
import {
	JSONDecoding,
	JSONEncodable,
	JSONEncoding,
	taggedObjectDecoder,
} from '@radixdlt/data-formats'
import { ok } from 'neverthrow'
import {
	isSpunParticles,
	spunParticles as makeSpunParticles,
} from './particles/spunParticles'
import { DSONCodable, DSONEncoding } from '@radixdlt/data-formats'
import { SpunParticle } from './particles/_index'

const SERIALIZER = 'radix.particle_group'

const DSON = (spunParticles: SpunParticles): DSONCodable =>
	DSONEncoding(SERIALIZER)({
		particles: spunParticles.spunParticles,
	})

const JSON = (
	spunParticles: SpunParticles | AnySpunParticle[],
): JSONEncodable =>
	JSONEncoding(SERIALIZER)({
		particles: isSpunParticles(spunParticles)
			? spunParticles.spunParticles
			: spunParticles,
	})

const jsonDecoding = JSONDecoding.withDependencies(SpunParticle)
	.withDecoders(
		taggedObjectDecoder(
			SERIALIZER,
			SERIALIZER_KEY,
		)((input: SpunParticles | AnySpunParticle[]) => ok(create(input))),
	)
	.create<ParticleGroupT>()

export const create = (
	spunParticles: SpunParticles | AnySpunParticle[],
): ParticleGroupT => {
	const spunParticles_: SpunParticles = isSpunParticles(spunParticles)
		? spunParticles
		: makeSpunParticles(spunParticles)

	return {
		...JSON(spunParticles),
		...DSON(spunParticles_),
		spunParticles: spunParticles_,
		...spunParticlesQueryable(spunParticles_.spunParticles),
	}
}

export const ParticleGroup = {
	create,
	...jsonDecoding,
	SERIALIZER,
}

import { ParticleGroup } from './_types'
import { AnySpunParticle, SpunParticles } from './particles/_types'
import { spunParticlesQueryable } from './particles/spunParticleQueryable'
import {
	JSONEncodable,
	JSONEncoding,
	JSONObjectDecoder,
} from '@radixdlt/data-formats'
import { ok } from 'neverthrow'
import {
	isSpunParticles,
	spunParticles as makeSpunParticles,
} from './particles/spunParticles'
import { DSONCodable, DSONEncoding } from '@radixdlt/data-formats'

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

export const PGJSONDecoder: JSONObjectDecoder = {
	[SERIALIZER]: (input: SpunParticles | AnySpunParticle[]) =>
		ok(particleGroup(input)),
}

export const particleGroup = (
	spunParticles: SpunParticles | AnySpunParticle[],
): ParticleGroup => {
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

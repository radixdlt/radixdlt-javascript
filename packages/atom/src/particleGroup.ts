import { ParticleGroup } from './_types'
import { AnySpunParticle, SpunParticles } from './particles/_types'
import { spunParticlesQueryable } from './particles/spunParticleQueryable'
import { isSpunParticles } from './particles/spunParticles'
import {
	DSONCodable,
	DSONEncoding,
	JSONEncodable,
	JSONEncoding,
	JSONObjectDecoder,
} from '@radixdlt/data-formats'
import { ok } from 'neverthrow'

const SERIALIZER = 'radix.particle_group'

const DSON = (spunParticles: SpunParticles | AnySpunParticle[]): DSONCodable =>
	DSONEncoding(SERIALIZER)({
		particles: isSpunParticles(spunParticles)
			? spunParticles.spunParticles
			: spunParticles,
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
	return {
		...JSON(spunParticles),
		...DSON(spunParticles),

		spunParticles: spunParticles as SpunParticles,
		...spunParticlesQueryable(
			isSpunParticles(spunParticles)
				? spunParticles.spunParticles
				: spunParticles,
		),
	}
}

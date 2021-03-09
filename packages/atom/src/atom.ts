import {
	AtomT,
	AtomIdentifier,
	ParticleGroups,
	Signatures,
	ParticleGroupT,
	SERIALIZER_KEY,
} from './_types'
import { atomIdentifier } from './atomIdentifier'
import { particleGroups } from './particleGroups'
import {
	DSONCodable,
	DSONEncoding,
	JSONEncodable,
	JSONEncoding,
	taggedObjectDecoder,
} from '@radixdlt/data-formats'
import { ok } from 'neverthrow'
import { equalsDSONHash } from './euid'
import { ParticleGroup } from './particleGroup'
import { JSONDecoding } from './utils'

const isSigned = (signatures: Signatures): boolean => {
	return Object.keys(signatures).length >= 1
}

// TODO implemented when we have DSON encoding of Atom.
const mockedAtomIdentifier = atomIdentifier(
	'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
)._unsafeUnwrap()

const SERIALIZER = 'radix.atom'

type Input = Readonly<{
	particleGroups?: ParticleGroups
	signatures?: Signatures
	message?: string
}>

// TODO make signature and message DSONCodable and add them here
const serialization = (
	input: Readonly<{
		particleGroups: ParticleGroupT[]
	}>,
): DSONCodable & JSONEncodable => {
	const keyValues = {
		particleGroups: input.particleGroups,
	}

	return {
		...DSONEncoding(SERIALIZER)(keyValues),
		...JSONEncoding(SERIALIZER)(keyValues),
	}
}

const JSONDecoder = taggedObjectDecoder(
	SERIALIZER,
	SERIALIZER_KEY,
)((input: Input) => ok(create(input)))

const jsonDecoding = JSONDecoding
	.withDependencies(ParticleGroup)
	.withDecoders(JSONDecoder)
	.create<AtomT>()

const create = (input: Input): AtomT => {
	const signatures: Signatures = input.signatures ?? {}
	const particleGroups_: ParticleGroups =
		input.particleGroups ?? particleGroups([])

	const atomExcludingEquals = {
		...serialization({
			particleGroups: particleGroups_.groups,
		}),
		particleGroups: particleGroups_,
		signatures: signatures,
		message: input.message,
		equals: (_other: AtomT): boolean => {
			throw new Error('implemented below')
		},
		identifier: (): AtomIdentifier => mockedAtomIdentifier,
		isSigned: () => isSigned(signatures),
		...particleGroups_, // makes AtomT `SpunParticleQueryable`
	}

	return {
		...atomExcludingEquals,
		equals: (other: AtomT): boolean =>
			equalsDSONHash(atomExcludingEquals, other),
	}
}

export const Atom = {
	SERIALIZER,
	...jsonDecoding,
	create,
}

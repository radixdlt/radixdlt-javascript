import {
	AtomT,
	AtomIdentifier,
	ParticleGroupT,
	ParticleGroups,
	Signatures,
} from './_types'
import { atomIdentifier } from './atomIdentifier'
import { particleGroups } from './particleGroups'
import {
	DSONCodable,
	DSONEncoding,
	JSONDecoding,
	JSONEncodable,
	JSONEncoding,
	objectDecoder,
} from '@radixdlt/data-formats'
import { ok } from 'neverthrow'
import { ParticleGroup } from './particleGroup'

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

const { JSONDecoders, fromJSON } = JSONDecoding(ParticleGroup)(
	objectDecoder(SERIALIZER, (input: Input) => ok(create(input))),
)

const create = (input: Input): AtomT => {
	const signatures: Signatures = input.signatures ?? {}
	const particleGroups_: ParticleGroups =
		input.particleGroups ?? particleGroups([])

	return {
		...serialization({
			particleGroups: particleGroups_.groups,
		}),

		particleGroups: particleGroups_,
		signatures: signatures,
		message: input.message,
		identifier: (): AtomIdentifier => mockedAtomIdentifier,
		isSigned: () => isSigned(signatures),
		...particleGroups_,
	}
}

export const Atom = {
	SERIALIZER,
	JSONDecoders,
	fromJSON,
	create,
}

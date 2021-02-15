import {
	Atom,
	AtomIdentifier,
	ParticleGroup,
	ParticleGroups,
	Signatures,
} from './_types'
import { atomIdentifier } from './atomIdentifier'
import { particleGroups } from './particleGroups'
import {
	DSONCodable,
	DSONEncoding,
	JSONEncodable,
	JSONEncoding,
	JSONObjectDecoder,
} from '@radixdlt/data-formats'
import { ok } from 'neverthrow'

const isSigned = (signatures: Signatures): boolean => {
	return Object.keys(signatures).length >= 1
}

// TODO implemented when we have DSON encoding of Atom.
const mockedAtomIdentifier = atomIdentifier(
	'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
)._unsafeUnwrap()

export const ATOM_SERIALIZER = 'radix.atom'

type Input = Readonly<{
	particleGroups?: ParticleGroups
	signatures?: Signatures
	message?: string
}>

const DSON = (
	input: Readonly<{
		particleGroups: ParticleGroup[]
	}>,
): DSONCodable =>
	DSONEncoding(ATOM_SERIALIZER)({
		particleGroups: input.particleGroups,
	})

const JSON = (
	input: Readonly<{
		particleGroups: ParticleGroup[]
	}>,
): JSONEncodable =>
	JSONEncoding(ATOM_SERIALIZER)({
		particleGroups: input.particleGroups,
	})

export const AtomJSONDecoder: JSONObjectDecoder = {
	[ATOM_SERIALIZER]: (input: Input) => ok(atom(input)),
}

export const atom = (input: Input): Atom => {
	const signatures: Signatures = input.signatures ?? {}
	const particleGroups_: ParticleGroups =
		input.particleGroups ?? particleGroups([])

	return {
		...JSON({
			particleGroups: particleGroups_.groups,
		}),
		...DSON({
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

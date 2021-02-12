import {
	Atom,
	AtomIdentifier,
	ParticleGroup,
	ParticleGroups,
	Signatures,
} from './_types'
import { atomIdentifier } from './atomIdentifier'
import { particleGroups } from './particleGroups'
import { particleGroup } from './particleGroup'
import { DSONCodable, DSONEncoding } from '@radixdlt/data-formats'
import { AnySpunParticle, SpunParticles } from './particles/_types'

const isSigned = (signatures: Signatures): boolean => {
	return Object.keys(signatures).length >= 1
}

// TODO implemented when we have DSON encoding of Atom.
const mockedAtomIdentifier = atomIdentifier(
	'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
)._unsafeUnwrap()

const SERIALIZER = 'radix.atom'

const DSON = (
	input: Readonly<{
		particleGroups: ParticleGroup[]
	}>,
): DSONCodable =>
	DSONEncoding(SERIALIZER)({
		particleGroups: input.particleGroups,
	})

export const atom = (
	input: Readonly<{
		particleGroups?: ParticleGroups
		signatures?: Signatures
		message?: string
	}>,
): Atom => {
	const signatures: Signatures = input.signatures ?? {}
	const particleGroups_: ParticleGroups =
		input.particleGroups ?? particleGroups([])

	return {
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

export const atomWithParticleGroups = (
	input: Readonly<{
		particleGroups: ParticleGroup[]
		signatures?: Signatures
		message?: string
	}>,
): Atom =>
	atom({
		...input,
		particleGroups: particleGroups(input.particleGroups),
	})

export const atomWithParticleGroup = (
	input: Readonly<{
		particleGroup: ParticleGroup
		signatures?: Signatures
		message?: string
	}>,
): Atom =>
	atomWithParticleGroups({
		...input,
		particleGroups: [input.particleGroup],
	})

export const atomWithSpunParticles = (
	input: Readonly<{
		spunParticles: SpunParticles | AnySpunParticle[]
		signatures?: Signatures
		message?: string
	}>,
): Atom =>
	atomWithParticleGroup({
		...input,
		particleGroup: particleGroup(input.spunParticles),
	})

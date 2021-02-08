import { Atom, AtomIdentifier, ParticleGroups, Signatures } from './_types'
import { atomIdentifier } from './atomIdentifier'
import { particleGroups } from './particleGroups'

const isSigned = (signatures: Signatures): boolean => {
	return Object.keys(signatures).length >= 1
}

// TODO implemented when we have DSON encoding of Atom.
const mockedAtomIdentifier = atomIdentifier(
	'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
)._unsafeUnwrap()

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
		particleGroups: particleGroups_,
		signatures: signatures,
		message: input.message,
		identifier: (): AtomIdentifier => mockedAtomIdentifier,
		isSigned: () => isSigned(signatures),
		...particleGroups_,
	}
}

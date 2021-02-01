import { Atom, AtomIdentifier, Signatures } from './_types'
import { spunParticles, isSpunParticles } from './particles/spunParticles'
import { atomIdentifier } from './atomIdentifier'
import { AnySpunParticle, SpunParticles } from './particles/_types'

const isSigned = (signatures: Signatures): boolean => {
	return signatures.size > 0
}

// TODO implemented when we have DSON encoding of Atom.
const mockedAtomIdentifier = atomIdentifier(
	'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
)._unsafeUnwrap()

export const atom = (
	input: Readonly<{
		particles: SpunParticles | AnySpunParticle[]
		signatures?: Signatures
		message?: string
	}>,
): Atom => {
	const spunParticles_ = isSpunParticles(input.particles)
		? input.particles
		: spunParticles(input.particles)

	const signatures = input.signatures ?? new Map()

	return {
		...spunParticles_,
		message: input.message,
		signatures: signatures,
		identifier: (): AtomIdentifier => mockedAtomIdentifier,
		isSigned: () => isSigned(signatures),
	}
}

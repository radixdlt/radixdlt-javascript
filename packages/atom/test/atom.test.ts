import { atom } from '../src/atom'
import { atomIdentifier } from '../src/atomIdentifier'
import {
	exactlyContainParticles,
	spunParticles_,
	rriParticle0Down,
	rriParticle1Down,
	ttParticle0Down,
	ttParticle1Down,
} from './helpers/particles'
import { SignatureID, Signatures } from '../src/_types'
import {
	ResourceIdentifierParticleType,
	TransferrableTokensParticleType,
} from '../src/particles/meta/radixParticleTypes'
import { signatureFromHexStrings } from './helpers/utility'
import { Spin } from '../src/particles/_types'
import { particleGroup } from '../src/particleGroup'
import { particleGroups } from '../src/particleGroups'

const mockedAtomIdentifier = atomIdentifier(
	'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
)._unsafeUnwrap()

describe('atom', () => {
	it('can be create empty', () => {
		const atom_ = atom({})
		expect(atom_).toBeDefined()
		expect(atom_.signatures).toBeDefined()
		expect(atom_.message).toBeUndefined()
		expect(atom_.identifier().equals(mockedAtomIdentifier)).toBe(true)
		expect(atom_.isSigned()).toBe(false)
	})

	it('can query anySpunParticles by spin=DOWN and by type=ResourceIdentifierParticle OR TransferrableTokensParticle since an atom itself is SpunParticles', () => {
		const atom_ = atom({
			particleGroups: particleGroups([particleGroup(spunParticles_)]),
		})

		expect(
			exactlyContainParticles({
				actual: atom_.anySpunParticlesOfTypeWithSpin({
					spin: Spin.DOWN,
					particleTypes: [
						ResourceIdentifierParticleType,
						TransferrableTokensParticleType,
					],
				}),
				expected: [
					rriParticle0Down,
					rriParticle1Down,
					ttParticle0Down,
					ttParticle1Down,
				],
			}),
		).toBe(true)
	})

	it('can contain a message', () => {
		const atom_ = atom({
			message: 'Hello',
		})

		expect(atom_).toBeDefined()
		expect(atom_.message).toBe('Hello')
	})

	it('is regarded as signed if it contains a signature', () => {
		const signature = signatureFromHexStrings({
			r:
				'934b1ea10a4b3c1757e2b0c017d0b6143ce3c9a7e6a4a49860d7a6ab210ee3d8',
			s:
				'2442ce9d2b916064108014783e923ec36b49743e2ffa1c4496f01a512aafd9e5',
		})

		const signatureID: SignatureID = "Alice's Signature"

		const signatures: Signatures = {
			[signatureID]: signature,
		}

		const atom_ = atom({
			signatures: signatures,
		})

		expect(atom_).toBeDefined()
		expect(atom_.isSigned()).toBe(true)
		const queriedSignature = atom_.signatures[signatureID]
		if (queriedSignature !== undefined) {
			expect(queriedSignature.equals(signature))
		} else {
			fail(
				`Expected atom to contain signature with ID='${signatureID}', but it did not.`,
			)
		}
	})
})

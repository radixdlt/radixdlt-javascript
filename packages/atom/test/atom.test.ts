import { atomIdentifier } from '../src/atomIdentifier'
import {
	exactlyContainParticles,
	spunParticles_,
	rriParticle0Down,
	rriParticle1Down,
	ttParticle0Down,
	ttParticle1Down,
} from './helpers/particles'
import { UInt256 } from '@radixdlt/uint256'
import {
	SignatureID,
	Signatures,
	TokenPermission,
	TokenTransition,
} from '../src/_types'
import { signatureFromHexStrings } from './helpers/utility'
import { Spin } from '../src/particles/_types'
import { RadixParticleType } from '../src/particles/meta/radixParticleTypes'
import { spunParticle } from '../src/particles/spunParticle'
import { addressFromBase58String } from '@radixdlt/crypto'
import { makeTokenPermissions } from '../src/tokenPermissions'
import {
	Atom,
	particleGroup,
	particleGroups,
	ResourceIdentifier,
	TransferrableTokensParticle,
} from '../dist/_index'
import { Amount, Denomination, nonce } from '@radixdlt/primitives'

const mockedAtomIdentifier = atomIdentifier(
	'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
)._unsafeUnwrap()

describe('atom', () => {
	it('can be create empty', () => {
		const atom_ = Atom.create({})
		expect(atom_).toBeDefined()
		expect(atom_.signatures).toBeDefined()
		expect(atom_.message).toBeUndefined()
		expect(atom_.identifier().equals(mockedAtomIdentifier)).toBe(true)
		expect(atom_.isSigned()).toBe(false)
	})

	it('can query anySpunParticles by spin=DOWN and by type=ResourceIdentifierParticle OR TransferrableTokensParticle since an atom itself is SpunParticles', () => {
		const atom_ = Atom.create({
			particleGroups: particleGroups([particleGroup(spunParticles_)]),
		})

		expect(
			exactlyContainParticles({
				actual: atom_.anySpunParticlesOfTypeWithSpin({
					spin: Spin.DOWN,
					particleTypes: [
						RadixParticleType.RESOURCE_IDENTIFIER,
						RadixParticleType.TRANSFERRABLE_TOKENS,
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
		const atom_ = Atom.create({
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

		const atom_ = Atom.create({
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

	describe('serialization', () => {
		const address = addressFromBase58String(
			'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
		)._unsafeUnwrap()
		const rri = ResourceIdentifier.fromAddressAndName({
			address,
			name: 'FOOBAR',
		})
		const permissions = makeTokenPermissions({
			[TokenTransition.BURN]: TokenPermission.ALL,
			[TokenTransition.MINT]: TokenPermission.TOKEN_OWNER_ONLY,
		})

		const amount = Amount.fromUnsafe(6, Denomination.Atto)._unsafeUnwrap()
		const granularity = Amount.inSmallestDenomination(UInt256.valueOf(3))
		const nonce_ = nonce(12345678910)
		const ttp = TransferrableTokensParticle.create({
			address,
			resourceIdentifier: rri,
			amount,
			granularity,
			permissions: permissions.permissions,
			nonce: nonce_,
		})._unsafeUnwrap()

		const particleGroup_ = particleGroup([
			spunParticle({
				spin: Spin.UP,
				particle: ttp,
			}),
		])

		const atom_ = Atom.create({
			particleGroups: particleGroups([particleGroup_]),
		})

		it('should be able to DSON encode', () => {
			const expected = atom_.toDSON()._unsafeUnwrap().toString('hex')

			expect(expected).toEqual(
				'bf6e7061727469636c6547726f75707381bf697061727469636c657381bf687061727469636c65bf6761646472657373582704390279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798b1186a1e66616d6f756e7458210500000000000000000000000000000000000000000000000000000000000000066b6772616e756c61726974795821050000000000000000000000000000000000000000000000000000000000000003656e6f6e63651b00000002dfdc1c3e6b7065726d697373696f6e73bf646275726e63616c6c646d696e7470746f6b656e5f6f776e65725f6f6e6c79ff6a73657269616c697a6572782472616469782e7061727469636c65732e7472616e736665727261626c655f746f6b656e737818746f6b656e446566696e6974696f6e5265666572656e6365583d062f3953386b684c485a6136467379476f36333478516f3951774c67534847705848485737363444356d50594263726e665a563652542f464f4f424152ff6a73657269616c697a65727372616469782e7370756e5f7061727469636c65647370696e01ff6a73657269616c697a65727472616469782e7061727469636c655f67726f7570ff6a73657269616c697a65726a72616469782e61746f6dff',
			)
		})

		it('should be able to JSON encode', () => {
			const result = atom_.toJSON()._unsafeUnwrap()
			const expected = {
				serializer: Atom.SERIALIZER,
				particleGroups: [particleGroup_.toJSON()._unsafeUnwrap()],
			}
			expect(JSON.stringify(result)).toEqual(JSON.stringify(expected))
		})

		it('should be able to JSON decode', () => {
			const json = {
				serializer: Atom.SERIALIZER,
			}

			const result = Atom.fromJSON(json)._unsafeUnwrap()
			const expected = Atom.create({})

			expect(JSON.stringify(result)).toEqual(JSON.stringify(expected))
		})
	})
})

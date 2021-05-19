import {
	EncryptedMessage,
	Message,
	MessageEncryption,
	KeyPair,
	PublicKeyT,
	DiffieHellman,
	PrivateKey,
} from '../src'
import { UInt256 } from '@radixdlt/uint256'

describe('message encryption', () => {
	describe('can decrypt newly encrypted message', () => {
		const alice = KeyPair.generateNew()
		const bob = KeyPair.generateNew()

		const aliceEncryptTo = async (
			to: PublicKeyT,
			plaintext: string,
		): Promise<EncryptedMessage> => {
			const res = await MessageEncryption.encrypt({
				plaintext,
				diffieHellmanPoint: alice.privateKey.diffieHellman.bind(
					null,
					to,
				),
			})
			return res._unsafeUnwrap()
		}

		const aliceEncryptToBob = aliceEncryptTo.bind(null, bob.publicKey)
		const aliceEncryptToSelf = aliceEncryptTo.bind(null, alice.publicKey)

		const decrypt = async (
			diffieHellman: DiffieHellman,
			publicKeyOfOtherParty: PublicKeyT,
			encryptedMessage: EncryptedMessage,
		): Promise<string> => {
			const res = await MessageEncryption.decrypt({
				encryptedMessage,
				diffieHellmanPoint: diffieHellman.bind(
					null,
					publicKeyOfOtherParty,
				),
			}).map((b) => b.toString('utf-8'))
			return res._unsafeUnwrap()
		}

		const aliceDecryptWithBobsPubKey = decrypt.bind(
			null,
			alice.privateKey.diffieHellman,
			bob.publicKey,
		)

		const aliceDecryptWithHerOwnPubKey = decrypt.bind(
			null,
			alice.privateKey.diffieHellman,
			alice.publicKey,
		)

		const bobDecrypt = decrypt.bind(
			null,
			bob.privateKey.diffieHellman,
			alice.publicKey,
		)

		it('encrypted message can be decrypted by both sender and receiver', async () => {
			const plaintext = 'Hey Bob!'
			const encryptedMessage = await aliceEncryptToBob(plaintext)
			expect(encryptedMessage.combined().length).toBeLessThanOrEqual(
				Message.maxLength,
			)
			const decryptedByAlice = await aliceDecryptWithBobsPubKey(
				encryptedMessage,
			)
			expect(decryptedByAlice).toBe(plaintext)

			const decryptedByBob = await bobDecrypt(encryptedMessage)
			expect(decryptedByBob).toBe(plaintext)

			expect(decryptedByBob).toBe(decryptedByAlice)
		})

		it('encrypted message to self can be decrypted by self', async () => {
			const plaintext = 'Hey Bob!'
			const encryptedMessage = await aliceEncryptToSelf(plaintext)
			expect(encryptedMessage.combined().length).toBeLessThanOrEqual(
				Message.maxLength,
			)
			const decryptedByAlice = await aliceDecryptWithHerOwnPubKey(
				encryptedMessage,
			)
			expect(decryptedByAlice).toBe(plaintext)
		})
	})

	describe('plaintext to encrypt cannot be too long', () => {
		const alicePrivateKey = PrivateKey.fromScalar(
			UInt256.valueOf(1),
		)._unsafeUnwrap()
		const bobPrivateKey = PrivateKey.fromScalar(
			UInt256.valueOf(2),
		)._unsafeUnwrap()
		const bob = bobPrivateKey.publicKey()

		it('throws error if plaintext is too long', (done) => {
			const tooLongMsg =
				'too long message that is too long because it is over characters limit which is too long to encrypt because it cannot fit because it is too long indeed. Which is why it cannot be encrypted. So expect an error to be thrown.'

			expect(tooLongMsg.length).toBeGreaterThan(
				Message.maxLengthOfCipherTextOfSealedMsg,
			)

			MessageEncryption.encrypt({
				plaintext: tooLongMsg,
				diffieHellmanPoint: alicePrivateKey.diffieHellman.bind(
					null,
					bob,
				),
			}).match(
				(_) => {
					done(new Error('Expected failure.'))
				},
				(error) => {
					expect(error.message).toBe(
						`Plaintext is too long, expected max #${Message.maxLengthOfCipherTextOfSealedMsg}, but got: #${tooLongMsg.length}`,
					)
					done()
				},
			)
		})

		// PLEASE SAVE, convenient to have.
		// it('alice can encrypt msg to bob', async (done) => {
		// 	await MessageEncryption.encrypt({
		// 		plaintext,
		// 		publicKeyOfOtherParty: bob,
		// 		dh: alicePrivateKey.diffieHellman
		// 	}).match(
		// 		(msg) => {
		// 			console.log(`🔮 msg combined: ${msg.combined().toString('hex')}`)
		// 			expect(msg.combined().toString('hex')).toBe(encryptedMessageByAliceToBobBuf.toString('hex'))
		// 			expect(msg.encryptionScheme.equals(EncryptionScheme.current)).toBe(true)
		// 			done()
		// 		},
		// 		(error) => {
		// 			done(new Error(`Expected to be able to encrypt message, but got error: ${error}`))
		// 		}
		// 	)
		// })
	})
})

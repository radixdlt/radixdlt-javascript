import { MessageEncryption } from '../src/encryption/message-encryption'
import { generateKeyPair } from '../src/elliptic-curve/keyPair'
import { EncryptedMessageT } from '../src/encryption/_types'
import { PublicKey, DiffieHellman } from '../src/_types'

describe('message encryption', () => {
	describe('new keys', () => {
		const alice = generateKeyPair()
		const bob = generateKeyPair()

		const aliceEncrypt = async (
			plaintext: string,
		): Promise<EncryptedMessageT> => {
			const res = await MessageEncryption.encrypt({
				plaintext,
				publicKeyOfOtherParty: bob.publicKey,
				dh: alice.privateKey.diffieHellman,
			})
			return res._unsafeUnwrap()
		}

		const decrypt = async (
			dh: DiffieHellman,
			publicKeyOfOtherParty: PublicKey,
			encryptedMessage: EncryptedMessageT,
		): Promise<string> => {
			const res = await MessageEncryption.decrypt({
				encryptedMessage,
				dh,
				publicKeyOfOtherParty,
			}).map((b) => b.toString('utf-8'))
			return res._unsafeUnwrap()
		}

		const aliceDecrypt = decrypt.bind(
			null,
			alice.privateKey.diffieHellman,
			bob.publicKey,
		)

		const bobDecrypt = decrypt.bind(
			null,
			bob.privateKey.diffieHellman,
			alice.publicKey,
		)

		it('encrypted message can be decrypted by both sender and receiver', async () => {
			const plaintext = 'Hey Bob!'
			const encryptedMessage = await aliceEncrypt(plaintext)
			const decryptedByAlice = await aliceDecrypt(encryptedMessage)
			expect(decryptedByAlice).toBe(plaintext)

			const decryptedByBob = await bobDecrypt(encryptedMessage)
			expect(decryptedByBob).toBe(plaintext)

			expect(decryptedByBob).toBe(decryptedByAlice)
		})
	})

	describe('persistent keys', () => {})
})

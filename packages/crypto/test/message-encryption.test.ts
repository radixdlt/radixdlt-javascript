import { CryptOperationKeysOfParties, MessageEncryption } from '../src/encryption/message-encryption'
import { generateKeyPair } from '../src/elliptic-curve/keyPair'
import { EncryptedMessageT } from '../src/encryption/_types'

describe('message encryption', () => {

	describe('new keys', () => {
		const alice = generateKeyPair()
		const bob = generateKeyPair()

		const encrypt = async (plaintext: string): Promise<EncryptedMessageT> => {

			const res = await MessageEncryption.encrypt({
				plaintext,
				partyKeys: {
					blackPartyPrivateKey: alice.privateKey,
					whitePartyPublicKey: bob.publicKey,
				}
			})
			return res._unsafeUnwrap()
		}

		const decrypt = async (partyKeys: CryptOperationKeysOfParties, encryptedMessage: EncryptedMessageT, ): Promise<string> => {
			const res = await MessageEncryption.decryptEncryptedMessage({
				encryptedMessage,
				partyKeys,
			}).map(b => b.toString('hex'))
			return res._unsafeUnwrap()
		}

		const aliceDecrypt = decrypt.bind(null, {
			blackPartyPrivateKey: alice.privateKey,
			whitePartyPublicKey: bob.publicKey
		})

		const bobDecrypt = decrypt.bind(null, {
			blackPartyPrivateKey: bob.privateKey,
			whitePartyPublicKey: alice.publicKey
		})

		it('encrypted message can be decrypted by both sender and receiver', async () => {
			const plaintext = 'Hey Bob!'
			const encryptedMessage = await encrypt(plaintext)
			const decryptedByAlice = await aliceDecrypt(encryptedMessage)
			const decryptedByBob = await bobDecrypt(encryptedMessage)
			expect(decryptedByBob).toBe(plaintext)
			expect(decryptedByAlice).toBe(decryptedByBob)
		})
	})


})
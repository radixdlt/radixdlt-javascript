import { MessageEncryption } from '../src/encryption/message-encryption'
import { generateKeyPair } from '../src/elliptic-curve/keyPair'
import { EncryptedMessageT } from '../src/encryption/_types'
import { PublicKey, DiffieHellman } from '../src/_types'
import { privateKeyFromScalar } from '../dist/elliptic-curve/privateKey'
import { UInt256 } from '@radixdlt/uint256'
import { EncryptedMessage } from '../dist/encryption/encryptedMessage'
import { SecureRandom } from '@radixdlt/util'
import { EncryptionScheme } from '../dist/encryption/encryptionScheme'
import { PrivateKey } from '../dist/_types'

describe('message encryption', () => {
	describe('can decrypt newly encrypted message', () => {
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

	describe('can decrypt message from buffer that was encrypted earlier', () => {
		const alicePrivateKey = privateKeyFromScalar(
			UInt256.valueOf(1),
		)._unsafeUnwrap()
		const alice = alicePrivateKey.publicKey()
		const bobPrivateKey = privateKeyFromScalar(
			UInt256.valueOf(2),
		)._unsafeUnwrap()
		const bob = bobPrivateKey.publicKey()

		// encrypted by outcommented test: 'alice can encrypt msg to bob' below
		const encryptedMessageByAliceToBobBuf = Buffer.from(
			'1f44485f4144445f4550485f41455347434d3235365f5343525950545f30303002f67f39dc3546aeb46626614212fba28fd6c38de8d428ee4830f8f7fbd99bb2f2670d8c962781aeb92a14b32746368a42d982f521627032f8e693d6c7e77857f86c91587b7cbea13c0397f3ab3d4149ea5cce9a719067768e6802cf9adeef85fea263ae6591ab492c1a6a5d4df4478b7c53d3f7b8d6af4216be39c96965cafe47bf4026cc3c',
			'hex',
		)

		const plaintext =
			'Hey Bob, this is Alice, you and I can read this message, but no one else.'

		type Decryptor = 'alice' | 'bob'

		const doTestDecrypt = async (
			decryptor: Decryptor,
			done: jest.DoneCallback,
		): Promise<void> => {
			const publicKeyOfOtherParty: PublicKey =
				decryptor === 'bob' ? alice : bob
			const privKey: PrivateKey =
				decryptor === 'bob' ? bobPrivateKey : alicePrivateKey
			const dh = privKey.diffieHellman

			await MessageEncryption.decrypt({
				encryptedMessage: encryptedMessageByAliceToBobBuf,
				publicKeyOfOtherParty,
				dh,
			}).match(
				(decrypted) => {
					expect(decrypted.toString('utf8')).toBe(plaintext)
					done()
				},
				(error) => {
					done(
						new Error(
							`Failed to decrypted, but expected to be able to decrypt, got error: ${error}`,
						),
					)
				},
			)
		}

		it('alice can decrypt msg encrypted by herself', (done) => {
			doTestDecrypt('alice', done)
		})

		it('bob can decrypt msg encrypted by alice', (done) => {
			doTestDecrypt('bob', done)
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

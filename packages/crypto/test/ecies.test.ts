// import { SecureRandom } from '@radixdlt/util'
// import { privateKeyFromScalar } from '../src/elliptic_curve/privateKey'
// import { UInt256 } from '@radixdlt/uint256'
// import { keyPair } from '../src/elliptic_curve/keyPair'
// import { generateKeyPair } from '../src/elliptic_curve/keyPair'
// import { unsafeDecrypt } from '../src/ecies/decryption/unsafeDecrypt'
// import { unsafeEncrypt } from '../src/ecies/encryption/unsafeEncrypt'
// import {
// 	unsafeCyonDecrypt,
// 	unsafeCyonEncrypt,
// } from '../src/ecies/unsafeCyonECIES'

describe('ECIES', () => {
	it('needs tests', () => {
		expect(true).toBe(true)
	})
/*
	it('can encrypt', () => {
		const unsafeTestRandom: SecureRandom = {
			randomSecureBytes: (byteCount: number) =>
				Array(byteCount).fill('ab').join(''),
		}

		const bob = generateKeyPair(unsafeTestRandom)
		const message = 'Hello Radix'

		const encryptedMessage = unsafeEncrypt({
			message: Buffer.from(message),
			peerPublicKey: bob.publicKey,
			secureRandom: unsafeTestRandom,
		})._unsafeUnwrap()

		expect(encryptedMessage.toBuffer().toString('hex')).toBe(
			'abababababababababababababababab210381aaadc8a5e83f4576df823cf22a5b1969cf704a0d5f6f68bd757410c9917aac00000010d755d6497300454edea73e99ff5f24df506c6fdd7e80dda8a36c230f38d716c6b5b17f88aea1abe12103e312e3dd58ec',
		)
	})

	it('can decrypt message', () => {
		const bob = keyPair(
			privateKeyFromScalar(UInt256.valueOf(1))._unsafeUnwrap(),
		)
		const encryptedMsgBuffer = Buffer.from(
			'51358bd242d0436b738dad123ebf1d8b2103ca9978dbb11cb9764e0bcae41504b4521f0290ac0f33fa659528549d9ce84d230000003096dc6785ea0dec1ac1ae15374e327635115407f9ae268aad8b4b6ebae1afefbc83c5792de6fc3550d3e0383918d182e87876c9c0e3b5ca0c960fd95b4bd18421ead2aaf472012e7cfbfd7b314cbae588',
			'hex',
		)
		const decrypted = unsafeDecrypt({
			buffer: encryptedMsgBuffer,
			privateKey: bob.privateKey,
		})._unsafeUnwrap()
		expect(decrypted.toString('utf-8')).toBe(
			'Hello Java Library from Radix Swift Library!',
		)
	})

	it('should be able to encrypt and then decrypt', () => {
		const bob = generateKeyPair()
		const message = 'top secret stuff'
		const encrypted = unsafeEncrypt({
			message: Buffer.from(message),
			peerPublicKey: bob.publicKey,
		})._unsafeUnwrap()

		const decrypted = unsafeDecrypt({
			buffer: encrypted.toBuffer(),
			privateKey: bob.privateKey,
		})._unsafeUnwrap()

		expect(decrypted.toString()).toBe(message)
	})

	it('should be possible for sender and recipient to decrypt encrypted message using Cyon ECIES', () => {
		const alice = generateKeyPair()
		const bob = generateKeyPair()
		const message = 'top secret stuff'

		const encrypted = unsafeCyonEncrypt({
			message: Buffer.from(message),
			senderPrivateKey: alice.privateKey,
			peerPublicKey: bob.publicKey,
		})._unsafeUnwrap()

		// Recipient Bob can decrupt
		const bobDecryption = unsafeCyonDecrypt({
			buffer: encrypted.toBuffer(),
			publicKey: alice.publicKey, // sender
			privateKey: bob.privateKey, // recipient
		})._unsafeUnwrap()

		expect(bobDecryption.toString()).toBe(message)

		// Sender Alice can als decrupt
		const aliceDecryption = unsafeCyonDecrypt({
			buffer: encrypted.toBuffer(),
			publicKey: bob.publicKey, // recipient
			privateKey: alice.privateKey, // sendert
		})._unsafeUnwrap()

		expect(aliceDecryption.toString()).toBe(message)
	})
	*/
})

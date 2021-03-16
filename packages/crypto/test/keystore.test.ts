import { secureRandomGenerator } from '@radixdlt/util'
import { Keystore, KeystoreT } from '../src/_index'

describe('keystore', () => {
	it('should be able to decrypt recently encrypted', async () => {
		const secret = 'my super secret phrase'
		const password = secureRandomGenerator.randomSecureBytes(20)
		const keystoreResult = await Keystore.encryptSecret({
			secret: Buffer.from(secret),
			password,
		})
		const keystore = keystoreResult._unsafeUnwrap()

		const decryptedResult = await Keystore.decrypt({
			keystore,
			password,
		})

		const decrypted = decryptedResult._unsafeUnwrap()
		expect(decrypted.toString('utf-8')).toBe(secret)
	})

	it('should be able to decrypt saved keystore', async () => {
		const keystore: KeystoreT = {
			crypto: {
				cipher: 'aes-256-gcm',
				cipherparams: {
					nonce: '196932fcfa7c0b8061a698b3',
				},
				ciphertext:
					'49ce243c72077f8b7cbfbb878b2d3f78d192c93adf0e2d07772cbd32dc1b5cd44fad93d4dacdae2ccf4685',
				kdf: 'scrypt',
				kdfparams: {
					costParameterN: 8192,
					costParameterC: 262144,
					blockSize: 8,
					parallelizationParameter: 1,
					lengthOfDerivedKey: 32,
					salt:
						'250dd310370eb0b571d6abce37cce6996edcedee9790e0e864132bce9c4174d1',
				},
				mac: 'a0d3461c9ef61d2df0af1bbbf18d994e',
			},
			id: 'bfdb15cd-c0e9-4fd0-8dc8-c488068dba79',
			version: 1,
		}

		const decryptedResult = await Keystore.decrypt({
			keystore,
			password: 'strong random generated password',
		})

		const decrypted = decryptedResult._unsafeUnwrap()
		expect(decrypted.toString('utf-8')).toBe(
			'My Bitcoins are burried underneath the oak.',
		)
	})
})

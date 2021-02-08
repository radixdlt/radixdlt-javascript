import { SecureRandom, secureRandomGenerator } from '@radixdlt/util'
import { Result } from 'neverthrow'
import { generatePrivateKey } from './privateKey'
import { publicKeyFromPrivateKey } from './wrap/publicKeyWrapped'
import { KeyPair } from './_types'

export const generateKeyPair = (
	secureRandom: SecureRandom = secureRandomGenerator,
): Result<KeyPair, Error> => {
	const privateKey = generatePrivateKey(secureRandom)
	return publicKeyFromPrivateKey({ privateKey: privateKey.scalar })
		.map((publicKey) => ({
			publicKey,
			privateKey,
		})
	)
}
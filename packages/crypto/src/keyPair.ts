import { SecureRandom, secureRandomGenerator } from '@radixdlt/util'
import { Result } from 'neverthrow'
import { generatePrivateKey } from './privateKey'
import { publicKeyFromPrivateKey } from './wrap/publicKeyWrapped'
import { KeyPair, PrivateKey } from './_types'

export const generateKeyPair = (
	secureRandom: SecureRandom = secureRandomGenerator,
): Result<KeyPair, Error> => {
	const privateKey = generatePrivateKey(secureRandom)
	return keyPair(privateKey)
}

export const keyPair = (privateKey: PrivateKey): Result<KeyPair, Error> => {
	return publicKeyFromPrivateKey({ privateKey: privateKey.scalar }).map(
		(publicKey) => ({
			publicKey,
			privateKey,
		}),
	)
}

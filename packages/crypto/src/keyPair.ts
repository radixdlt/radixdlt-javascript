import { SecureRandom, secureRandomGenerator } from '@radixdlt/util'
import { generatePrivateKey } from './privateKey'
import { KeyPair, PrivateKey } from './_types'

export const generateKeyPair = (
	secureRandom: SecureRandom = secureRandomGenerator,
): KeyPair => {
	const privateKey = generatePrivateKey(secureRandom)
	return keyPair(privateKey)
}

export const keyPair = (privateKey: PrivateKey): KeyPair => ({
	privateKey,
	publicKey: privateKey.publicKey(),
})

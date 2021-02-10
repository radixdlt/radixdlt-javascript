import { ECIESDecryptProcedures } from '../_types'
import { diffieHellmanPublicKey } from '../../key-exchange/diffie-hellman'
import { unsafeKDF } from '../../key-derivation-functions/unsafeKDF'
import { unsafeAESDecryption } from '../../symmetric-encryption/aes/unsafeAESDecryption'
import { hmacSHA256 } from '../../message-authentication-code/hmac'

export const unsafeECIESDecryptionProcedures: ECIESDecryptProcedures = {
	diffieHellmanRoutine: diffieHellmanPublicKey,
	keyDerivationScheme: unsafeKDF,
	decryptionScheme: unsafeAESDecryption,
	messageAuthenticationCodeScheme: hmacSHA256,
}

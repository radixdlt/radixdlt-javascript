import { ECIESEncryptProcedures } from '../_types'
import { diffieHellmanPublicKey } from '../../key-exchange/diffie-hellman'
import { unsafeKDF } from '../../key-derivation-functions/unsafeKDF'
import { hmacSHA256 } from '../../message-authentication-code/hmac'
import { unsafeAESEncryption } from '../../symmetric-encryption/aes/unsafeAESEncryption'

export const unsafeECIESEncryptionProcedures: ECIESEncryptProcedures = {
	diffieHellmanRoutine: diffieHellmanPublicKey,
	keyDerivationScheme: unsafeKDF,
	encryptionScheme: unsafeAESEncryption,
	messageAuthenticationCodeScheme: hmacSHA256,
}

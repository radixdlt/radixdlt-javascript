import { KeyPair, PublicKey } from '../_types'

export type ECIESEncryptInput = Readonly<{
	dataToEncrypt: Buffer
	// recipientPublicKey: PublicKey
	produceSecret: (ephemeralKeyPair: KeyPair) => Buffer
}>

// https://en.wikipedia.org/wiki/Integrated_Encryption_Scheme#Information_required
export type ECIESEncryptedMessage = Readonly<{
	cipherText: Buffer // `c`
	sharedSecret: Buffer // `R`, i.e. ephemeral public key
	tag: Buffer // `d`, e.g. MAC(kM, c||S2)
	toBuffer: () => Buffer // R || c || d
}>

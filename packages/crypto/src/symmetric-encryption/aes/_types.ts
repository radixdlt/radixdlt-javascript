export type AES_GCM_SealedBoxT = Readonly<{
	authTag: Buffer
	ciphertext: Buffer
	nonce: Buffer
}>

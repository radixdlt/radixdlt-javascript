import { AES_GCM_SealedBoxT } from './_types'

const create = (
	input: Readonly<{
		authTag: Buffer
		ciphertext: Buffer
		nonce: Buffer
	}>,
): AES_GCM_SealedBoxT => {
	const { ciphertext, nonce, authTag } = input
	return {
		...input,
	}
}

export const AES_GCM_SealedBox = {
	create,
}

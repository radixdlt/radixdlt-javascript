import hashjs from 'hash.js'

export type Hasher = {
	readonly hash: (input: { readonly unhashedData: Buffer }) => Buffer
}

export const sha256 = (input: { readonly unhashedData: Buffer }): Buffer => {
	return Buffer.from(hashjs.sha256().update(input.unhashedData).digest())
}

export const SHA256 = (): Hasher => {
	return {
		hash: sha256,
	}
}

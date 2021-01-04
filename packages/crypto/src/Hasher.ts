import hashjs from 'hash.js'

export type Hasher = (inputData: Buffer) => Buffer

export const sha256: Hasher = (inputData: Buffer): Buffer => {
	return Buffer.from(hashjs.sha256().update(inputData).digest())
}

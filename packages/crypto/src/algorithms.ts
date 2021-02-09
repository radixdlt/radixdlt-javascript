// import hashjs from 'hash.js'
import { sha256 as SHA256, sha512 as SHA512 } from 'hash.js'
import { Hasher } from './_types'

export const sha256: Hasher = (inputData: Buffer): Buffer => {
	return Buffer.from(SHA256().update(inputData).digest())
}

export const sha256Twice: Hasher = (inputData: Buffer): Buffer => {
	return sha256(sha256(inputData))
}

export const sha512: Hasher = (inputData: Buffer): Buffer => {
	return Buffer.from(SHA512().update(inputData).digest())
}

export const sha512Twice: Hasher = (inputData: Buffer): Buffer => {
	return sha512(sha512(inputData))
}

export const radixHash = sha256Twice
export const radixHashByteCount = 32

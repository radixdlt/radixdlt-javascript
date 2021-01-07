import hashjs from 'hash.js'
import { Hasher } from './_types'

export const sha256: Hasher = (inputData: Buffer): Buffer => {
	return Buffer.from(hashjs.sha256().update(inputData).digest())
}

export const sha256Twice: Hasher = (inputData: Buffer): Buffer => {
	return sha256(sha256(inputData))
}

export const radixHash = sha256Twice

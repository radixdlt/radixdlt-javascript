import hashjs from 'hash.js'
import { Hasher } from './_types'

export const sha256: Hasher = (inputData: Buffer): Buffer => {
	return Buffer.from(hashjs.sha256().update(inputData).digest())
}

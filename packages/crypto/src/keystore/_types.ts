import { ScryptParamsT } from '../key-derivation-functions/_types'
import { PathLike } from 'fs'
import { FileHandle } from 'fs/promises'
import { ResultAsync } from 'neverthrow'
import { ValidationWitness } from '@radixdlt/util'

export type KeystoreCryptoCipherParamsT = Readonly<{
	nonce: string
}>

export type KeystoreCryptoT = Readonly<{
	cipher: string
	cipherparams: KeystoreCryptoCipherParamsT
	ciphertext: string
	kdf: string
	kdfparams: ScryptParamsT
	mac: string
}>

export type KeystoreT = Readonly<{
	memo?: string
	crypto: KeystoreCryptoT
	id: string
	version: number
}>

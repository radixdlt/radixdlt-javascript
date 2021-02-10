import { SharedInfo } from '../ecies/_types'

export type CombineDataIntoCryptInput = (
	input: Readonly<{
		message: Buffer
		sharedInfo: SharedInfo
	}>,
) => Buffer

export type Encryptor = Readonly<{
	encrypt: (input: Readonly<{ dataToEncrypt: Buffer }>) => Buffer
}>

export type EncryptionFunctionBuilder = Readonly<{
	buildEncryptionFunction: (
		input: Readonly<{
			key: Buffer
			sharedInfo: SharedInfo
		}>,
	) => Encryptor
}>

export type Decryptor = Readonly<{
	decrypt: (input: Readonly<{ cipher: Buffer }>) => Buffer
}>

export type DecryptionFunctionBuilder = Readonly<{
	buildDecryptionFunction: (
		input: Readonly<{
			key: Buffer
			sharedInfo: SharedInfo
		}>,
	) => Decryptor
}>

export type EncryptionScheme = Readonly<{
	/// `enckeylen`
	length: number
	combineDataIntoCryptInput: CombineDataIntoCryptInput
	encryptionFunctionBuilder: EncryptionFunctionBuilder
	// encryptionFunction: (
	// 	input: Readonly<{ key: Buffer; dataToEncrypt: Buffer }>,
	// ) => Buffer
}>

export type DecryptionScheme = Readonly<{
	/// `enckeylen`
	length: number
	combineDataIntoCryptInput: CombineDataIntoCryptInput
	// decryptFunction: (
	// 	input: Readonly<{ key: Buffer; cipher: Buffer }>,
	// ) => Buffer
	decryptionFunctionBuilder: DecryptionFunctionBuilder
}>

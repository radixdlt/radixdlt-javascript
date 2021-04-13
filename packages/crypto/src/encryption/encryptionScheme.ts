import { combine, err, ok, Result } from 'neverthrow'
import {
	buffersEquals,
	byteToBuffer,
	firstByteOfNumber,
	readBuffer,
	ValidationWitness,
} from '@radixdlt/util'
import { Byte } from 'packages/util/src/_types'
import { validateLength, validateMaxLength, validateMinLength } from '../utils'
import { EncryptionSchemeT } from './_types'

const currentEncryptionSchemeIdentifier = 'DH_ADD_EPH_AESGCM256_SCRYPT_000'

const supportedEncryptionSchemes: [string] = [currentEncryptionSchemeIdentifier]

export const encryptionSchemeIdentifierPadChar = '='

export const encryptionSchemeLength = 32
export const encryptionSchemeLengthSpecifyingByteCount = 1
export const encryptionSchemeIdentifierLength =
	encryptionSchemeLength - encryptionSchemeLengthSpecifyingByteCount

const create = (
	input: Readonly<{
		length: Byte
		identifier: Buffer
	}>,
): EncryptionSchemeT => {
	const combinedBuf = Buffer.concat([
		byteToBuffer(input.length),
		input.identifier,
	])
	return {
		...input,
		combined: (): Buffer => combinedBuf,
		equals: (other: EncryptionSchemeT) =>
			buffersEquals(combinedBuf, other.combined()),
	}
}

const encryptionSchemeNamed = (
	name: string,
): Result<EncryptionSchemeT, Error> => {
	const actualLength = name.length
	const lengthAsByte: Byte = firstByteOfNumber(actualLength)
	if (actualLength > encryptionSchemeIdentifierLength) {
		return err(
			new Error(
				`Encryption scheme identifier must be ${encryptionSchemeIdentifierLength} chars or less.`,
			),
		)
	}
	// pad if needed
	const padded = name.padEnd(
		encryptionSchemeIdentifierLength,
		encryptionSchemeIdentifierPadChar,
	)
	const identifier = Buffer.from(padded, 'utf-8')

	if (identifier.length !== encryptionSchemeIdentifierLength) {
		throw new Error(
			`Incorrect implementation of padded identifier, should be ${encryptionSchemeIdentifierLength} chars.`,
		)
	}

	return ok(
		create({
			length: lengthAsByte,
			identifier,
		}),
	)
}

export const __validateEncryptionSchemeLength: (
	buffer: Buffer,
) => Result<Buffer, Error> = validateLength.bind(
	null,
	encryptionSchemeLength,
	'encryptionScheme',
)

const __validateEncryptionSchemeIdentifierMaxLength: (
	buffer: Buffer,
) => Result<Buffer, Error> = validateMaxLength.bind(
	null,
	encryptionSchemeIdentifierLength,
	'encryptionSchemeIdentifier',
)

const __validateEncryptionSchemeIdentifierMinLength: (
	buffer: Buffer,
) => Result<Buffer, Error> = validateMinLength.bind(
	null,
	1,
	'encryptionSchemeIdentifier',
)

export const __validateEncryptionSchemeIdentifierLength = (
	buffer: Buffer,
): Result<Buffer, Error> =>
	combine([
		__validateEncryptionSchemeIdentifierMaxLength(buffer),
		__validateEncryptionSchemeIdentifierMinLength(buffer),
	]).map((_) => buffer)

const encryptionSchemeFromBuffer = (
	buffer: Buffer,
): Result<EncryptionSchemeT, Error> => {
	return __validateEncryptionSchemeLength(buffer)
		.andThen((buffer) => {
			const readNextBuffer = readBuffer.bind(null, buffer)()
			return readNextBuffer(encryptionSchemeLengthSpecifyingByteCount)
				.map((schemeIdLenBuf) => schemeIdLenBuf.readUInt8())
				.andThen((schemeIdLenNum) => readNextBuffer(schemeIdLenNum))
				.andThen(__validateEncryptionSchemeIdentifierLength)
		})
		.map(
			(identifier): EncryptionSchemeT =>
				create({
					length: firstByteOfNumber(identifier.length),
					identifier,
				}),
		)
}

const encryptionScheme = encryptionSchemeNamed(
	currentEncryptionSchemeIdentifier,
)._unsafeUnwrap()

const isSupported = (
	scheme: EncryptionSchemeT,
): Result<ValidationWitness, Error> => {
	const encryptionSchemeIdentifier = scheme.identifier.toString('utf-8')

	if (!supportedEncryptionSchemes.includes(encryptionSchemeIdentifier)) {
		const supportedString = supportedEncryptionSchemes
			.map(
				(s) =>
					`${s}${
						s === currentEncryptionSchemeIdentifier
							? ' (current)'
							: ''
					}`,
			)
			.join(',\n')
		return err(
			new Error(
				`Unsupported encryption scheme, encrypted message specified scheme='${encryptionSchemeIdentifier}', but the only supported schemes are:\n${supportedString}`,
			),
		)
	}
	return ok({ witness: 'supported' })
}

export const EncryptionScheme = {
	create,
	isSupported,
	supportedSchemes: supportedEncryptionSchemes,
	current: encryptionScheme,
	fromName: encryptionSchemeNamed,
	fromBuffer: encryptionSchemeFromBuffer,
}

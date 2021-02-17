import { Address, PublicKey } from './_types'
import { publicKeyFromBytes } from './publicKey'
import { radixHash } from './algorithms'
import { Magic } from '@radixdlt/primitives'
import { Byte, byteToBuffer, firstByteFromBuffer } from '@radixdlt/util'
import { Result, ok, err } from 'neverthrow'
import { base58Encode, base58Decode } from './wrap/baseConversion'
import {
	DSONObjectEncoding,
	JSONEncoding,
	JSONPrimitiveDecoder,
	serializerNotNeeded,
} from '@radixdlt/data-formats'

const checksumByteCount = 4

export const CBOR_BYTESTRING_PREFIX: Byte = 4
export const JSON_TAG = ':adr:'

export const AddressJSONDecoder: JSONPrimitiveDecoder = {
	[JSON_TAG]: (input: string) => addressFromBase58String(input),
}

export const addressFromPublicKeyAndMagic = (
	input: Readonly<{
		publicKey: PublicKey
		magic: Magic
	}>,
): Address =>
	addressFromPublicKeyAndMagicByte({
		publicKey: input.publicKey,
		magicByte: input.magic.byte,
	})

export const addressFromPublicKeyAndMagicByte = (
	input: Readonly<{
		publicKey: PublicKey
		magicByte: Byte
	}>,
): Address => {
	const buffer = calculateAndAppendChecksumFromPubKeyAndMagic(input)

	const toString = (): string => base58Encode(buffer)

	return {
		...JSONEncoding(serializerNotNeeded)(() => `${JSON_TAG}${toString()}`),
		...DSONObjectEncoding({
			prefix: CBOR_BYTESTRING_PREFIX,
			buffer,
		}),
		publicKey: input.publicKey,
		magicByte: input.magicByte,
		toString,
		equals: (other) =>
			input.magicByte === other.magicByte &&
			input.publicKey.equals(other.publicKey),
	}
}

export const addressFromBase58String = (
	b58String: string,
): Result<Address, Error> => base58Decode(b58String).andThen(addressFromBuffer)

const addressFromBuffer = (buffer: Buffer): Result<Address, Error> => {
	const publicKeyCompressedByteCount = 33
	const magicByteCount = 1
	const addressByteCount =
		magicByteCount + publicKeyCompressedByteCount + checksumByteCount

	if (buffer.length != addressByteCount)
		return err(
			new Error(
				`Expected ${addressByteCount} bytes, but got ${buffer.length}`,
			),
		)

	const checksumDropped = buffer.slice(
		0,
		addressByteCount - checksumByteCount,
	)

	const checksummedAddress = calculateAndAppendChecksum(checksumDropped)
	if (Buffer.compare(checksummedAddress, buffer) !== 0)
		return err(new Error(`Checksum mismatch`))

	const magicByte: Byte = firstByteFromBuffer(checksummedAddress)
	const toString = (): string => base58Encode(checksummedAddress)

	return publicKeyFromBytes(
		checksummedAddress.slice(
			magicByteCount,
			magicByteCount + publicKeyCompressedByteCount,
		),
	).andThen((publicKey: PublicKey) =>
		ok({
			...DSONObjectEncoding({ prefix: CBOR_BYTESTRING_PREFIX, buffer }),
			...JSONEncoding(serializerNotNeeded)(
				() => `${JSON_TAG}${toString()}`,
			),
			publicKey,
			magicByte,
			toString,
			equals: (other: Address) =>
				magicByte === other.magicByte &&
				publicKey.equals(other.publicKey),
		}),
	)
}

const bytesForAddress = (
	input: Readonly<{
		publicKey: PublicKey
		magicByte: Byte
	}>,
): Buffer =>
	Buffer.concat([
		byteToBuffer(input.magicByte),
		input.publicKey.asData({ compressed: true }),
	])

const calculateAndAppendChecksumFromPubKeyAndMagic = (
	input: Readonly<{
		publicKey: PublicKey
		magicByte: Byte
	}>,
): Buffer => {
	const buffer = bytesForAddress(input)
	return calculateAndAppendChecksum(buffer)
}

const calculateAndAppendChecksum = (buffer: Buffer): Buffer => {
	const checksum = radixHash(buffer)
	const checksumFirstFourBytes = checksum.slice(0, checksumByteCount)
	return Buffer.concat([buffer, checksumFirstFourBytes])
}

export const isAddress = (
	something: Address | unknown,
): something is Address => {
	const inspection = something as Address
	return (
		inspection.magicByte !== undefined &&
		inspection.publicKey !== undefined &&
		inspection.toString !== undefined &&
		inspection.equals !== undefined
	)
}

export const addressFromUnsafe = (
	input: Address | string,
): Result<Address, Error> => {
	return isAddress(input)
		? ok(input)
		: typeof input === 'string'
		? addressFromBase58String(input)
		: err(new Error('bad type'))
}

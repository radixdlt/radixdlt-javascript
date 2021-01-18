import { AddressLike, PublicKey } from './_types'
import { publicKeyFromBytes } from './publicKey'
import { radixHash } from './algorithms'
import { Byte, byteToBuffer, firstByteFromBuffer } from '@radixdlt/primitives'
import { Result, ok, err } from 'neverthrow'
import { base58Encode, base58Decode } from './wrap/baseConversion'

const checksumByteCount = 4

export type Base58String = string

export type AddressInput =
	| Base58String
	| Readonly<{
			publicKey: PublicKey
			magicByte: Byte
	  }>

export const Address = (input: AddressInput): Result<AddressLike, Error> => {
	if (typeof input === 'string') {
		return addressFromBase58String(input)
	} else {
		return ok({
			publicKey: input.publicKey,
			magicByte: input.magicByte,
			toString: (): string =>
				base58Encode(
					calculateAndAppendChecksumFromPubKeyAndMagic(input),
				),
			equals: (other: AddressLike) =>
				input.magicByte === other.magicByte &&
				input.publicKey.equals(other.publicKey),
		})
	}
}

const addressFromBase58String = (
	b58String: string,
): Result<AddressLike, Error> =>
	base58Decode(b58String).andThen(addressFromBuffer)

const addressFromBuffer = (buffer: Buffer): Result<AddressLike, Error> => {
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

	return publicKeyFromBytes(
		checksummedAddress.slice(
			magicByteCount,
			magicByteCount + publicKeyCompressedByteCount,
		),
	).andThen((publicKey: PublicKey) =>
		ok({
			publicKey,
			magicByte,
			toString: (): string => base58Encode(checksummedAddress),
			equals: (other: AddressLike) =>
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
	something: AddressLike | unknown,
): something is AddressLike => {
	const inspection = something as AddressLike
	return (
		inspection.magicByte !== undefined &&
		inspection.publicKey !== undefined &&
		inspection.toString !== undefined &&
		inspection.equals !== undefined
	)
}

export const addressFromUnsafe = (
	input: AddressLike | string,
): Result<AddressLike, Error> => {
	return isAddress(input)
		? ok(input)
		: typeof input === 'string'
		? addressFromBase58String(input)
		: err(new Error('bad type'))
}

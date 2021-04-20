import { AddressT } from './_types'
import { Magic } from '@radixdlt/primitives'
import { Byte, byteToBuffer, firstByteFromBuffer } from '@radixdlt/util'
import { Result, ok, err } from 'neverthrow'
import {
	base58Decode,
	base58Encode,
	PublicKey,
	publicKeyFromBytes,
} from '@radixdlt/crypto'
import { sha256Twice } from '@radixdlt/crypto'
import { publicKeyCompressedByteCount } from '@radixdlt/crypto'

const checksumByteCount = 4

const fromPublicKeyAndMagic = (
	input: Readonly<{
		publicKey: PublicKey
		magic: Magic
	}>,
): AddressT =>
	fromPublicKeyAndMagicByte({
		publicKey: input.publicKey,
		magicByte: input.magic.byte,
	})

const fromPublicKeyAndMagicByte = (
	input: Readonly<{
		publicKey: PublicKey
		magicByte: Byte
	}>,
): AddressT => {
	const buffer = calculateAndAppendChecksumFromPubKeyAndMagic(input)

	const toString = (): string => base58Encode(buffer)

	return {
		publicKey: input.publicKey,
		magicByte: input.magicByte,
		toString,
		equals: (other) =>
			input.magicByte === other.magicByte &&
			input.publicKey.equals(other.publicKey),
	}
}

const fromBase58String = (b58String: string): Result<AddressT, Error> =>
	base58Decode(b58String).andThen(addressFromBuffer)

const addressFromBuffer = (buffer: Buffer): Result<AddressT, Error> => {
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
			publicKey,
			magicByte,
			toString,
			equals: (other: AddressT) =>
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
	const checksum = sha256Twice(buffer)
	const checksumFirstFourBytes = checksum.slice(0, checksumByteCount)
	return Buffer.concat([buffer, checksumFirstFourBytes])
}

export const isAddress = (
	something: AddressT | unknown,
): something is AddressT => {
	const inspection = something as AddressT
	return (
		inspection.magicByte !== undefined &&
		inspection.publicKey !== undefined &&
		inspection.toString !== undefined &&
		inspection.equals !== undefined
	)
}

export type AddressUnsafeInput = string

export const isAddressUnsafeInput = (
	something: unknown,
): something is AddressUnsafeInput => typeof something === 'string'

export type AddressOrUnsafeInput = AddressT | AddressUnsafeInput

export const isAddressOrUnsafeInput = (
	something: unknown,
): something is AddressOrUnsafeInput =>
	isAddress(something) || isAddressUnsafeInput(something)

const fromUnsafe = (input: AddressOrUnsafeInput): Result<AddressT, Error> => {
	return isAddress(input)
		? ok(input)
		: isAddressUnsafeInput(input)
			? fromBase58String(input)
			: err(new Error('bad type'))
}

export const Address = {
	fromUnsafe,
	isAddress,
	fromBase58String,
	fromPublicKeyAndMagicByte,
	fromPublicKeyAndMagic,
}

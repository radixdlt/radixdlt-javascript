import { Address, PublicKey } from './_types'
import { radixHash } from './algorithms'
import {
	Magic,
	Byte,
	byteToBuffer,
	firstByteFromBuffer,
} from '@radixdlt/primitives'
import { Result, ok, err } from 'neverthrow'
import { publicKeyFromBytes } from './wrap/publicKey'
import { base58Encode, base58Decode } from './wrap/baseConversion'

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
	return {
		publicKey: input.publicKey,
		magicByte: input.magicByte,
		toString: (): string =>
			base58Encode(calculateAndAppendChecksumFromPubKeyAndMagic(input)),
	}
}

const publicKeyCompressedByteCount = 33
const checksumByteCount = 4
const magicByteCount = 1
const addressByteCount =
	magicByteCount + publicKeyCompressedByteCount + checksumByteCount

const addressFromBuffer = (buffer: Buffer): Result<Address, Error> => {
	if (buffer.length != addressByteCount) {
		return err(
			new Error(
				`Expected ${addressByteCount} bytes, but got ${buffer.length}`,
			),
		)
	}

	const checksumDropped = buffer.slice(
		0,
		addressByteCount - checksumByteCount,
	)
	const checksummedAddress = calculateAndAppendChecksum(checksumDropped)
	if (checksummedAddress !== buffer) {
		return err(new Error('Checksum mismatch'))
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
	const magicByte: Byte = firstByteFromBuffer(checksummedAddress)

	return publicKeyFromBytes(
		checksummedAddress.slice(
			magicByteCount,
			magicByteCount + publicKeyCompressedByteCount,
		),
	).andThen((pubKey) => {
		return ok({
			publicKey: pubKey,
			magicByte: magicByte,
			toString: (): string => base58Encode(checksummedAddress),
		})
	})
}

export const address = (base58: string): Result<Address, Error> => {
	return base58Decode(base58).andThen(addressFromBuffer)
}

const bytesForAddress = (
	input: Readonly<{
		publicKey: PublicKey
		magicByte: Byte
	}>,
): Buffer => {
	return Buffer.concat([
		byteToBuffer(input.magicByte),
		input.publicKey.asData({ compressed: true }),
	])
}

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
	const checksum = calculateChecksum(buffer)
	const checksumFirstFourBytes = checksum.slice(0, checksumByteCount)
	return Buffer.concat([buffer, checksumFirstFourBytes])
}

const calculateChecksum = (buffer: Buffer): Buffer => radixHash(buffer)

import { Address, PublicKey } from './_types'
import { radixHash } from './algorithms'
import { Magic, Byte, byteToBuffer } from '@radixdlt/primitives'
import { encode as base58Encode } from 'bs58'

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
		toString: (): string => base58Encode(checksum(input)),
	}
}

const checksum = (
	input: Readonly<{
		publicKey: PublicKey
		magicByte: Byte
	}>,
): Buffer => {
	const data = Buffer.concat([
		byteToBuffer(input.magicByte),
		input.publicKey.asData({ compressed: true }),
	])
	const checksum = radixHash(data)
	const checksumFirstByte = checksum.slice(0)
	const checksummed = Buffer.concat([data, checksumFirstByte])
	return checksummed
}

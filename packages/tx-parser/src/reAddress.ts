import {
	REAddressHashedKeyNonce,
	REAddressNativeToken,
	REAddressPublicKey,
	REAddressSystem,
	REAddressT,
	BufferReaderT,
	REAddressType,
} from './_types'
import { ok, Result } from 'neverthrow'
import { PublicKey, PublicKeyT } from '@radixdlt/crypto'

/* eslint-disable no-case-declarations */
const fromBufferReader = (
	bufferReader: BufferReaderT,
): Result<REAddressT, Error> =>
	bufferReader
		.readNextBuffer(1)
		// .map(b => b.readUInt8())
		// .map(n => n as REAddressType)
		.map(b => ({
			reAddressTypeBuf: b,
			reAddressType: b.readUInt8() as REAddressType,
		}))
		.andThen(
			(aa): Result<REAddressT, Error> => {
				const { reAddressTypeBuf, reAddressType } = aa
				switch (reAddressType) {
					case REAddressType.SYSTEM:
						const systemAddress: REAddressSystem = {
							reAddressType: REAddressType.SYSTEM,
							toBuffer: () => reAddressTypeBuf,
							toString: () =>
								`REAddressType.SYSTEM (Always empty)`,
						}
						return ok(systemAddress)
					case REAddressType.RADIX_NATIVE_TOKEN:
						const nativeToken: REAddressNativeToken = {
							reAddressType: REAddressType.RADIX_NATIVE_TOKEN,
							toBuffer: () => reAddressTypeBuf,
							toString: () =>
								`REAddressType.RADIX_NATIVE_TOKEN (Always empty)`,
						}
						return ok(nativeToken)
					case REAddressType.HASHED_KEY_NONCE:
						return bufferReader.readNextBuffer(26).map(
							(lower26Bytes): REAddressHashedKeyNonce => ({
								reAddressType: REAddressType.HASHED_KEY_NONCE,
								lower26Bytes,
								toBuffer: () =>
									Buffer.concat([
										reAddressTypeBuf,
										lower26Bytes,
									]),
								toString: () =>
									`REAddressType.HASHED_KEY_NONCE: { lower26Bytes: ${lower26Bytes.toString(
										'hex',
									)} }`,
							}),
						)
					case REAddressType.PUBLIC_KEY:
						return bufferReader
							.readNextBuffer(33)
							.andThen(pubKeyBytes =>
								PublicKey.fromBuffer(pubKeyBytes),
							)
							.map(
								(
									publicKey: PublicKeyT,
								): REAddressPublicKey => ({
									reAddressType: REAddressType.PUBLIC_KEY,
									publicKey,
									toBuffer: () =>
										Buffer.concat([
											reAddressTypeBuf,
											publicKey.asData({
												compressed: true,
											}),
										]),
									toString: () =>
										`REAddressType.PUBLIC_KEY: { publicKey: ${publicKey.toString(
											true,
										)} }`,
								}),
							)
				}
			},
		)
/* eslint-enable no-case-declarations */

export const REAddress = {
	fromBufferReader,
}

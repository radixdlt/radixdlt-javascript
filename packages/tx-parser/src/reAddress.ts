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
		.map(b => b.readUInt8())
		.map(n => n as REAddressType)
		.andThen(
			(reAddressType: REAddressType): Result<REAddressT, Error> => {
				switch (reAddressType) {
					case REAddressType.SYSTEM:
						const systemAddress: REAddressSystem = {
							reAddressType: REAddressType.SYSTEM,
							toBuffer: () => Buffer.alloc(0),
							toString: () =>
								`REAddressType.SYSTEM (Always empty)`,
						}
						return ok(systemAddress)
					case REAddressType.RADIX_NATIVE_TOKEN:
						const nativeToken: REAddressNativeToken = {
							reAddressType: REAddressType.RADIX_NATIVE_TOKEN,
							toBuffer: () => Buffer.alloc(0),
							toString: () =>
								`REAddressType.RADIX_NATIVE_TOKEN (Always empty)`,
						}
						return ok(nativeToken)
					case REAddressType.HASHED_KEY_NONCE:
						return bufferReader.readNextBuffer(26).map(
							(lower26Bytes): REAddressHashedKeyNonce => ({
								reAddressType: REAddressType.HASHED_KEY_NONCE,
								lower26Bytes,
								toBuffer: () => lower26Bytes,
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
										publicKey.asData({ compressed: true }),
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

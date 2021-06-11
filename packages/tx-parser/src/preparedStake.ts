import { combine, Result } from 'neverthrow'
import { PreparedStakeT, REAddressT, SubStateType } from './_types'
import { REAddress } from './reAddress'
import { UInt256 } from '@radixdlt/uint256'
import { PublicKey, PublicKeyT } from '@radixdlt/crypto'
import {
	amountToBuffer,
	stringifyUInt256,
	uint256FromReadBuffer,
} from './tokens'
import { BufferReaderT } from '@radixdlt/util'
import { AccountAddress, ValidatorAddress } from '@radixdlt/account'

export const pubKeyFromReadBuffer = (
	bufferReader: BufferReaderT,
): Result<PublicKeyT, Error> =>
	bufferReader.readNextBuffer(33).andThen(b => PublicKey.fromBuffer(b))

const fromBufferReader = (
	bufferReader: BufferReaderT,
): Result<PreparedStakeT, Error> =>
	combine([
		REAddress.fromBufferReader(bufferReader),
		pubKeyFromReadBuffer(bufferReader),
		uint256FromReadBuffer(bufferReader),
	])
		.map(resList => ({
			owner: resList[0] as REAddressT,
			delegate: resList[1] as PublicKeyT,
			amount: resList[2] as UInt256,
		}))
		.map(
			(partial): PreparedStakeT => {
				const { owner, delegate, amount } = partial
				const buffer = Buffer.concat([
					Buffer.from([SubStateType.PREPARED_STAKE]),
					owner.toBuffer(),
					delegate.asData({ compressed: true }),
					amountToBuffer(amount),
				])
				return {
					...partial,
					substateType: SubStateType.PREPARED_STAKE,
					toBuffer: () => buffer,
					toString: () =>
						`PreparedStake { owner: 0x${owner
							.toBuffer()
							.toString(
								'hex',
							)}, delegate: 0x${delegate.toString()}, amount: U256 { raw: ${amount.toString()} } }`,

					toHumanReadableString: () =>
						`PreparedStake { owner: ${AccountAddress.fromUnsafe(
							owner.toBuffer(),
						)
							._unsafeUnwrap()
							.toString()}, delegate: ${ValidatorAddress.fromUnsafe(
							delegate.asData({ compressed: true }),
						)
							._unsafeUnwrap()
							.toString()}, amount: ${stringifyUInt256(
							amount,
						)} }`,
				}
			},
		)

export const PreparedStake = {
	fromBufferReader,
}

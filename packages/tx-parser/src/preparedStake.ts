import { ReadBuffer } from './transaction'
import { combine, Result } from 'neverthrow'
import { PreparedStakeT, REAddressT, SubStateType } from './_types'
import { REAddress } from './reAddress'
import { UInt256 } from '@radixdlt/uint256'
import { PublicKey, PublicKeyT } from '@radixdlt/crypto'
import { amountToBuffer, uint256FromReadBuffer } from './tokens'

export const pubKeyFromReadBuffer = (
	readBuffer: ReadBuffer,
): Result<PublicKeyT, Error> =>
	readBuffer(33).andThen(b => PublicKey.fromBuffer(b))

const fromReadBuffer = (
	readBuffer: ReadBuffer,
): Result<PreparedStakeT, Error> =>
	combine([
		REAddress.fromReadBuffer(readBuffer),
		pubKeyFromReadBuffer(readBuffer),
		uint256FromReadBuffer(readBuffer),
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
					owner.toBuffer(),
					delegate.asData({ compressed: true }),
					amountToBuffer(amount),
				])
				return {
					...partial,
					substateType: SubStateType.PREPARED_STAKE,
					toBuffer: () => buffer,
					toString: () => `PreparedStakeT: { 
						owner: ${owner.toString()},
						delegate: ${delegate.toString()},
						amount: ${amount.toString()},
					}`,
				}
			},
		)

export const PreparedStake = {
	fromReadBuffer,
}

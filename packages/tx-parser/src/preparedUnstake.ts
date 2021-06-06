import { ReadBuffer } from './transaction'
import { combine, Result } from 'neverthrow'
import { PreparedUnstakeT, REAddressT, SubStateType } from './_types'
import { REAddress } from './reAddress'
import { amountToBuffer, uint256FromReadBuffer } from './tokens'
import { UInt256 } from '@radixdlt/uint256'
import { pubKeyFromReadBuffer } from './preparedStake'
import { PublicKeyT } from '@radixdlt/crypto'

const fromReadBuffer = (
	readBuffer: ReadBuffer,
): Result<PreparedUnstakeT, Error> =>
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
			(partial): PreparedUnstakeT => {
				const { owner, delegate, amount } = partial
				const buffer = Buffer.concat([
					owner.toBuffer(),
					delegate.asData({ compressed: true }),
					amountToBuffer(amount),
				])
				return {
					...partial,
					substateType: SubStateType.PREPARED_UNSTAKE,
					toBuffer: () => buffer,
					toString: () => `PreparedUnstakeT: { 
						owner: ${owner.toString()},
						delegate: ${delegate.toString()},
						amount: ${amount.toString()},
					}`,
				}
			},
		)

export const PreparedUnstake = {
	fromReadBuffer,
}

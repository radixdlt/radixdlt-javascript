import { combine, Result } from 'neverthrow'
import { PreparedUnstakeT, REAddressT, SubStateType } from './_types'
import { REAddress } from './reAddress'
import { amountToBuffer, uint256FromReadBuffer } from './tokens'
import { UInt256 } from '@radixdlt/uint256'
import { pubKeyFromReadBuffer } from './preparedStake'
import { PublicKeyT } from '@radixdlt/crypto'
import { BufferReaderT } from '@radixdlt/util'

const fromBufferReader = (
	bufferReader: BufferReaderT,
): Result<PreparedUnstakeT, Error> =>
	combine([
		pubKeyFromReadBuffer(bufferReader),
		REAddress.fromBufferReader(bufferReader),
		uint256FromReadBuffer(bufferReader),
	])
		.map(resList => ({
			delegate: resList[0] as PublicKeyT,
			owner: resList[1] as REAddressT,
			amount: resList[2] as UInt256,
		}))
		.map(
			(partial): PreparedUnstakeT => {
				const { delegate, owner, amount } = partial
				const buffer = Buffer.concat([
					Buffer.from([SubStateType.PREPARED_UNSTAKE]),
					delegate.asData({ compressed: true }),
					owner.toBuffer(),
					amountToBuffer(amount),
				])
				return {
					...partial,
					substateType: SubStateType.PREPARED_UNSTAKE,
					toBuffer: () => buffer,
					toString: () =>
						`PreparedUnstake { delegate: 0x${delegate.toString()}, owner: 0x${owner
							.toBuffer()
							.toString(
								'hex',
							)}, amount: U256 { raw: ${amount.toString()} } }`,
				}
			},
		)

export const PreparedUnstake = {
	fromBufferReader,
}

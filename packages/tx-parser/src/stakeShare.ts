import { combine, Result } from 'neverthrow'
import { REAddressT, SubStateType, StakeShareT } from './_types'
import { REAddress } from './reAddress'
import { amountToBuffer, uint256FromReadBuffer } from './tokens'
import { UInt256 } from '@radixdlt/uint256'
import { pubKeyFromReadBuffer } from './preparedStake'
import { PublicKeyT } from '@radixdlt/crypto'
import { BufferReaderT } from '@radixdlt/util'
import { AccountAddress, ValidatorAddress } from '@radixdlt/account'

const fromBufferReader = (
	bufferReader: BufferReaderT,
): Result<StakeShareT, Error> =>
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
			(partial): StakeShareT => {
				const { delegate, owner, amount } = partial
				const buffer = Buffer.concat([
					Buffer.from([SubStateType.STAKE_SHARE]),
					delegate.asData({ compressed: true }),
					owner.toBuffer(),
					amountToBuffer(amount),
				])
				return {
					...partial,
					substateType: SubStateType.STAKE_SHARE,
					toBuffer: () => buffer,
					toString: () => `StakeShare: { 
						delegate: ${delegate.toString()},
						owner: ${owner.toString()},
						amount: ${amount.toString()},
					}`,
					toHumanReadableString: () =>
						`StakeShare { owner: ${AccountAddress.fromUnsafe(
							owner.toBuffer(),
						)
							._unsafeUnwrap()
							.toString()}, delegate: ${ValidatorAddress.fromUnsafe(
							delegate.asData({ compressed: true }),
						)
							._unsafeUnwrap()
							.toString()}, amount: U256 { raw: ${amount.toString()} } }`,
				}
			},
		)

export const StakeShare = {
	fromBufferReader,
}

import { combine, Result } from 'neverthrow'
import { REAddressT, SubStateType, TokensT, BufferReaderT } from './_types'
import { REAddress } from './reAddress'
import { UInt256 } from '@radixdlt/uint256'

const uint256ByteCount = 32

export const uint256FromReadBuffer = (
	bufferReader: BufferReaderT,
): Result<UInt256, Error> =>
	bufferReader
		.readNextBuffer(uint256ByteCount)
		.map(b => new UInt256(b.toString('hex'), 16))

export const amountToBuffer = (amount: UInt256): Buffer =>
	Buffer.from(amount.toByteArray()).reverse() // fix endianess.

const fromBufferReader = (
	bufferReader: BufferReaderT,
): Result<TokensT, Error> =>
	combine([
		REAddress.fromBufferReader(bufferReader),
		REAddress.fromBufferReader(bufferReader),
		uint256FromReadBuffer(bufferReader),
	])
		.map(resList => ({
			rri: resList[0] as REAddressT,
			owner: resList[1] as REAddressT,
			amount: resList[2] as UInt256,
		}))
		.map(
			(partial): TokensT => {
				const { rri, owner, amount } = partial
				const buffer = Buffer.concat([
					Buffer.from([SubStateType.TOKENS]),
					rri.toBuffer(),
					owner.toBuffer(),
					amountToBuffer(amount),
				])
				return {
					...partial,
					substateType: SubStateType.TOKENS,
					toBuffer: () => buffer,
					toString: () => `Tokens: { 
						rri: ${rri.toString()},
						owner: ${owner.toString()},
						amount: ${amount.toString()},
					}`,
				}
			},
		)

export const Tokens = {
	fromBufferReader,
}

import { ReadBuffer } from './transaction'
import { combine, Result } from 'neverthrow'
import { REAddressT, SubStateType, TokensT } from './_types'
import { REAddress } from './reAddress'
import { UInt256 } from '@radixdlt/uint256'

export const uint256FromReadBuffer = (
	readBuffer: ReadBuffer,
): Result<UInt256, Error> =>
	readBuffer(33).map(b => new UInt256(b.toString('hex'), 16))

export const amountToBuffer = (amount: UInt256): Buffer => {
	const buffer = Buffer.from(amount.toString(), 'hex')
	if (buffer.length !== 32) {
		throw new Error(
			`Incorrect implementation, amount should always serialize into 32 bytes`,
		)
	}
	return buffer
}

const fromReadBuffer = (readBuffer: ReadBuffer): Result<TokensT, Error> =>
	combine([
		REAddress.fromReadBuffer(readBuffer),
		REAddress.fromReadBuffer(readBuffer),
		uint256FromReadBuffer(readBuffer),
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
	fromReadBuffer,
}

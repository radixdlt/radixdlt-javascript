import { combine, Result } from 'neverthrow'
import { TXSig } from './_types'
import { Byte } from '@radixdlt/util'
import { UInt256 } from '@radixdlt/uint256'
import { ReadBuffer } from './transaction'
import { amountToBuffer } from './tokens'

const fromReadBuffer = (readBuffer: ReadBuffer): Result<TXSig, Error> =>
	combine([readBuffer(1), readBuffer(32), readBuffer(32)])
		.map(resList => {
			const v = resList[0].readUInt8() as Byte

			const uint256FromBuffer = (b: unknown): UInt256 => {
				const hex = (b as Buffer).toString('hex')
				return new UInt256(hex, 16)
			}

			const r = uint256FromBuffer(resList[1])
			const s = uint256FromBuffer(resList[2])

			return {
				v,
				r,
				s,
			}
		})
		.map(partial => {
			const buffer = Buffer.concat([
				Buffer.from([partial.v]),
				amountToBuffer(partial.r),
				amountToBuffer(partial.s),
			])
			return {
				...partial,
				toBuffer: () => buffer,
				toString: () => buffer.toString('hex'),
			}
		})

export const TxSignature = {
	fromReadBuffer,
}

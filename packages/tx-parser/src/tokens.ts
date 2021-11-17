import { combine, Result } from 'neverthrow'
import { REAddressT, SubStateType, TokensT } from './_types'
import { REAddress } from './reAddress'
import { UInt256 } from '@radixdlt/uint256'
import { BufferReaderT, Byte } from '@radixdlt/util'
import { ResourceIdentifier, AccountAddress } from '@radixdlt/account'
import BigNumber from 'bignumber.js'
import { AmountT } from 'packages/primitives/src/_types'

const uint256ByteCount = 32

export const stringifyUInt256 = (uint256: UInt256) => {
	const factor = new BigNumber('1e18')
	const bigNumber = new BigNumber(uint256.toString())
	const precision = 4
	return bigNumber.dividedToIntegerBy(factor).toFormat(precision)
}

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
	lengthData: Buffer,
): Result<TokensT, Error> =>
	combine([
		bufferReader.readNextBuffer(1).map(b => b.readUInt8(0)),
		REAddress.fromBufferReader(bufferReader),
		REAddress.fromBufferReader(bufferReader),
		uint256FromReadBuffer(bufferReader),
	])
		.map(resList => ({
			reserved: resList[0] as Byte,
			owner: resList[1] as REAddressT,
			resource: resList[2] as REAddressT,
			amount: resList[3] as AmountT,
		}))
		.map(
			(partial): TokensT => {
				const { resource, owner, reserved, amount } = partial
				const buffer = Buffer.concat([
					lengthData,
					Buffer.from([SubStateType.TOKENS]),
					Buffer.from([reserved]),
					owner.toBuffer(),
					resource.toBuffer(),
					amountToBuffer(amount),
				])
				return {
					...partial,
					substateType: SubStateType.TOKENS,
					toBuffer: () => buffer,
					toString: () =>
						`Tokens { reserved: ${reserved}, owner: 0x${owner
							.toBuffer()
							.toString(
								'hex',
							)}, resource: 0x${resource
							.toBuffer()
							.toString(
								'hex',
							)}, amount: U256 { raw: ${amount.toString()} } }`,
					toHumanReadableString: () =>
						`Tokens { 
						reserved: ${reserved},
						owner: ${AccountAddress.fromUnsafe(owner.toBuffer().slice(1))
							._unsafeUnwrap()
							.toString()}
						resource: ${
							resource.toBuffer().length === 1
								? ResourceIdentifier.fromUnsafe(
										resource.toBuffer(),
								  )
										._unsafeUnwrap()
										.toString()
								: resource.toBuffer().toString('hex')
						}, 
							, amount: ${stringifyUInt256(amount)} }`,
				}
			},
		)

export const Tokens = {
	fromBufferReader,
}

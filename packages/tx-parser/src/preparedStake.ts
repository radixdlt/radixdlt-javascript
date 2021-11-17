import { combine, Result } from 'neverthrow'
import {
	BaseStakingSubstate,
	BaseValidatorSubstate,
	PreparedStakeT,
	REAddressT,
	stringifySubstateType,
	SubStateType,
} from './_types'
import { REAddress } from './reAddress'
import { UInt256 } from '@radixdlt/uint256'
import { PublicKey, PublicKeyT } from '@radixdlt/crypto'
import {
	amountToBuffer,
	stringifyUInt256,
	uint256FromReadBuffer,
} from './tokens'
import { BufferReaderT, Byte } from '@radixdlt/util'
import { AccountAddress, ValidatorAddress } from '@radixdlt/account'
import { AmountT } from 'packages/primitives/src/_types'

export const pubKeyFromReadBuffer = (
	bufferReader: BufferReaderT,
): Result<PublicKeyT, Error> =>
	bufferReader.readNextBuffer(33).andThen(b => PublicKey.fromBuffer(b))

export const makeBaseValidatorSubstateFromBuffer = <SST extends SubStateType>(
	substateType: SST,
) => (
	bufferReader: BufferReaderT,
): Result<Omit<BaseValidatorSubstate<SST>, 'toString'>, Error> =>
	combine([
		bufferReader.readNextBuffer(1).map(b => b.readUInt8(0)),
		pubKeyFromReadBuffer(bufferReader),
	])
		.map(resList => ({
			reserved: resList[0] as Byte,
			validator: resList[1] as PublicKeyT,
		}))
		.map(
			(partial): BaseValidatorSubstate<SST> => {
				const { reserved, validator } = partial
				const buffer = Buffer.concat([
					Buffer.from([substateType]),
					Buffer.from([reserved]),
					validator.asData({ compressed: true }),
				])
				return {
					...partial,
					substateType,
					toBuffer: () => buffer,
				}
			},
		)

export const makeBaseStakeSubstateFromBuffer = <SST extends SubStateType>(
	substateType: SST,
) => (
	bufferReader: BufferReaderT,
	lengthData: Buffer,
): Result<BaseStakingSubstate<SST>, Error> =>
	makeBaseValidatorSubstateFromBuffer(substateType)(bufferReader).andThen(
		base =>
			combine([
				REAddress.fromBufferReader(bufferReader),
				uint256FromReadBuffer(bufferReader),
			]).map(
				(resList): BaseStakingSubstate<SST> => {
					const owner = resList[0] as REAddressT
					const amount = resList[1] as AmountT
					const reserved = base.reserved
					const validator = base.validator
					return {
						...base,
						owner,
						amount,
						toBuffer: (): Buffer =>
							Buffer.concat([
								lengthData,
								base.toBuffer(),
								owner.toBuffer(),
								amountToBuffer(amount),
							]),
						toString: () =>
							`${stringifySubstateType(
								substateType,
							)} { reserved: ${reserved}, validator: 0x${validator.toString()}, owner: 0x${owner
								.toBuffer()
								.toString(
									'hex',
								)}, amount: U256 { raw: ${amount.toString()} } }`,

						toHumanReadableString: () =>
							`${stringifySubstateType(
								substateType,
							)} { reserved: ${reserved}, validator: ${ValidatorAddress.fromUnsafe(
								validator.asData({ compressed: true }),
							)
								._unsafeUnwrap()
								.toString()}, owner: ${AccountAddress.fromUnsafe(
								owner.toBuffer(),
							)
								._unsafeUnwrap()
								.toString()}, amount: ${stringifyUInt256(
								amount,
							)} }`,
					}
				},
			),
	)

export const PreparedStake = {
	fromBufferReader: (
		bufferReader: BufferReaderT,
		lengthData: Buffer,
	): Result<PreparedStakeT, Error> =>
		makeBaseStakeSubstateFromBuffer(SubStateType.PREPARED_STAKE)(
			bufferReader,
			lengthData,
		),
}

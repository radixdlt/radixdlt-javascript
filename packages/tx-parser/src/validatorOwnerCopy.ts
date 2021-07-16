import { BufferReaderT } from '@radixdlt/util'
import { Result } from 'neverthrow'
import {
	stringifySubstateType,
	SubStateType,
	ValidatorOwnerCopyT,
} from './_types'
import { makeBaseValidatorSubstateFromBuffer } from './preparedStake'
import { REAddress } from './reAddress'

const makeValidatorValidatorOwnerCopy = (
	bufferReader: BufferReaderT,
	lengthData: Buffer
): Result<ValidatorOwnerCopyT, Error> =>
	makeBaseValidatorSubstateFromBuffer(SubStateType.VALIDATOR_OWNER_COPY)(
		bufferReader,
	).andThen(
		(base): Result<ValidatorOwnerCopyT, Error> =>
			REAddress.fromBufferReader(bufferReader).map(
				(owner): ValidatorOwnerCopyT => {
					const reserved = base.reserved
					const validator = base.validator
					return {
						...base,
						owner,
						toBuffer: (): Buffer =>
							Buffer.concat([lengthData, base.toBuffer(), owner.toBuffer()]),
						toString: () =>
							`${stringifySubstateType(
								SubStateType.VALIDATOR_OWNER_COPY,
							)} { reserved: ${reserved}, validator: 0x${validator.toString()}, owner: 0x${owner
								.toBuffer()
								.toString('hex')} }`,
					}
				},
			),
	)

export const ValidatorOwnerCopy = {
	fromBufferReader: (
		bufferReader: BufferReaderT,
		lengthData: Buffer
	): Result<ValidatorOwnerCopyT, Error> =>
		makeValidatorValidatorOwnerCopy(bufferReader, lengthData),
}

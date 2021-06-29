import {
	stringifySubstateType,
	SubStateType,
	ValidatorAllowDelegationFlagT,
} from './_types'
import { BufferReaderT } from '@radixdlt/util'
import { err, ok, Result } from 'neverthrow'
import { makeBaseValidatorSubstateFromBuffer } from './preparedStake'

export const boolFromBufferReader = (
	bufferReader: BufferReaderT,
): Result<boolean, Error> =>
	bufferReader
		.readNextBuffer(1)
		.map(b => b.readUInt8(0))
		.andThen(i =>
			i === 1
				? ok(true)
				: i === 0
				? ok(false)
				: err(new Error('Expected bool.')),
		)

export const boolToBuf = (bool: boolean): Buffer => Buffer.from([bool ? 1 : 0])

const makeValidatorAllowDelegationFlagFromBuffer = (
	bufferReader: BufferReaderT,
): Result<ValidatorAllowDelegationFlagT, Error> =>
	makeBaseValidatorSubstateFromBuffer(
		SubStateType.VALIDATOR_ALLOW_DELEGATION_FLAG,
	)(bufferReader).andThen(
		(base): Result<ValidatorAllowDelegationFlagT, Error> =>
			boolFromBufferReader(bufferReader).map(
				(isDelegationAllowed): ValidatorAllowDelegationFlagT => {
					const reserved = base.reserved
					const validator = base.validator
					return {
						...base,
						isDelegationAllowed,
						toBuffer: (): Buffer =>
							Buffer.concat([
								base.toBuffer(),
								boolToBuf(isDelegationAllowed),
							]),
						toString: () =>
							`${stringifySubstateType(
								SubStateType.VALIDATOR_ALLOW_DELEGATION_FLAG,
							)} { reserved: ${reserved}, validator: 0x${validator.toString()}, is_delegation_allowed: ${isDelegationAllowed} }`,
					}
				},
			),
	)

export const ValidatorAllowDelegationFlag = {
	fromBufferReader: (
		bufferReader: BufferReaderT,
	): Result<ValidatorAllowDelegationFlagT, Error> =>
		makeValidatorAllowDelegationFlagFromBuffer(bufferReader),
}

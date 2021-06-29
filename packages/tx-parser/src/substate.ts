import { SubstateT, SubStateType } from './_types'
import { Result } from 'neverthrow'
import { Tokens } from './tokens'
import { PreparedStake } from './preparedStake'
import { PreparedUnstake } from './preparedUnstake'
import { ValidatorAllowDelegationFlag } from './validatorAllowDelegationFlag'
import { BufferReaderT } from '@radixdlt/util'
import { ValidatorOwnerCopy } from './validatorOwnerCopy'

const parseFromBufferReader = (
	bufferReader: BufferReaderT,
): Result<SubstateT, Error> =>
	bufferReader
		.readNextBuffer(1)
		.map(b => b.readUInt8(0))
		.map(n => n as SubStateType)
		.andThen(
			(substateType: SubStateType): Result<SubstateT, Error> => {
				switch (substateType) {
					case SubStateType.TOKENS:
						return Tokens.fromBufferReader(bufferReader)
					case SubStateType.PREPARED_STAKE:
						return PreparedStake.fromBufferReader(bufferReader)
					case SubStateType.PREPARED_UNSTAKE:
						return PreparedUnstake.fromBufferReader(bufferReader)
					case SubStateType.VALIDATOR_ALLOW_DELEGATION_FLAG:
						return ValidatorAllowDelegationFlag.fromBufferReader(
							bufferReader,
						)
					case SubStateType.VALIDATOR_OWNER_COPY:
						return ValidatorOwnerCopy.fromBufferReader(bufferReader)
					default:
						throw new Error(
							`Substate of type: ${SubStateType[substateType]} not implemented.`,
						)
				}
			},
		)

export const Substate = {
	parseFromBufferReader,
}

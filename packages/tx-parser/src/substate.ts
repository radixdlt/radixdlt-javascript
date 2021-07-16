import { SubstateT, SubStateType } from './_types'
import { Result } from 'neverthrow'
import { Tokens } from './tokens'
import { PreparedStake } from './preparedStake'
import { PreparedUnstake } from './preparedUnstake'
import { StakeOwnership } from './stakeOwnership'
import { ValidatorAllowDelegationFlag } from './validatorAllowDelegationFlag'
import { BufferReaderT } from '@radixdlt/util'
import { ValidatorOwnerCopy } from './validatorOwnerCopy'

const LENGTH_BYTES = 2
const TYPE_BYTES = 1

const parseFromBufferReader = (
	bufferReader: BufferReaderT,
): Result<SubstateT, Error> =>
	bufferReader
		.readNextBuffer(LENGTH_BYTES + TYPE_BYTES)
		.map(b => {
			const lengthData = Buffer.from(b.slice(0, LENGTH_BYTES))
			return [b.readUInt8(LENGTH_BYTES), lengthData]
		})
		.map(([type, lengthData]) => [type, lengthData] as [SubStateType, Buffer])
		.andThen(
			([substateType, lengthData]): Result<SubstateT, Error> => {
				switch (substateType) {
					case SubStateType.TOKENS:
						return Tokens.fromBufferReader(bufferReader, lengthData)
					case SubStateType.PREPARED_STAKE:
						return PreparedStake.fromBufferReader(bufferReader, lengthData)
					case SubStateType.PREPARED_UNSTAKE:
						return PreparedUnstake.fromBufferReader(bufferReader, lengthData)
					case SubStateType.STAKE_OWNERSHIP:
						return StakeOwnership.fromBufferReader(bufferReader, lengthData)
					case SubStateType.VALIDATOR_ALLOW_DELEGATION_FLAG:
						return ValidatorAllowDelegationFlag.fromBufferReader(
							bufferReader,
							lengthData
						)
					case SubStateType.VALIDATOR_OWNER_COPY:
						return ValidatorOwnerCopy.fromBufferReader(bufferReader, lengthData)
					default:
						throw new Error(
							`Substate ${substateType} of type: ${SubStateType[substateType]} not implemented.`,
						)
				}
			},
		)

export const Substate = {
	parseFromBufferReader,
}

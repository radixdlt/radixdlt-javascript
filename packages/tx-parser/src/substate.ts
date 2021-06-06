import { BufferReaderT, SubStateType, SubstateT } from './_types'
import { Result } from 'neverthrow'
import { Tokens } from './tokens'
import { PreparedStake } from './preparedStake'
import { PreparedUnstake } from './preparedUnstake'

const parseFromBufferReader = (
	bufferReader: BufferReaderT,
): Result<SubstateT, Error> =>
	bufferReader
		.readNextBuffer(1)
		.map(b => b.readUInt8())
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

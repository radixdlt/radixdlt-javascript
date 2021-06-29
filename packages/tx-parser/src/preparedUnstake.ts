import { Result } from 'neverthrow'
import { PreparedUnstakeT, SubStateType } from './_types'
import { makeBaseStakeSubstateFromBuffer } from './preparedStake'
import { BufferReaderT } from '@radixdlt/util'

export const PreparedUnstake = {
	fromBufferReader: (
		bufferReader: BufferReaderT,
	): Result<PreparedUnstakeT, Error> =>
		makeBaseStakeSubstateFromBuffer(SubStateType.PREPARED_UNSTAKE)(
			bufferReader,
		),
}

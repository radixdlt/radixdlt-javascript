import { Result } from 'neverthrow'
import { PreparedUnstakeT, SubStateType } from './_types'
import { makeBaseStakeSubstateFromBuffer } from './preparedStake'
import { BufferReaderT } from '@radixdlt/util'

export const PreparedUnstake = {
	fromBufferReader: (
		bufferReader: BufferReaderT,
		lengthData: Buffer
	): Result<PreparedUnstakeT, Error> =>
		makeBaseStakeSubstateFromBuffer(SubStateType.PREPARED_UNSTAKE)(
			bufferReader,
			lengthData
		),
}

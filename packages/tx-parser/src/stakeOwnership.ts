import { Result } from 'neverthrow'
import { SubStateType, StakeOwnershipT } from './_types'
import { BufferReaderT } from '@radixdlt/util'
import { makeBaseStakeSubstateFromBuffer } from './preparedStake'

export const StakeOwnership = {
	fromBufferReader: (
		bufferReader: BufferReaderT,
	): Result<StakeOwnershipT, Error> =>
		makeBaseStakeSubstateFromBuffer(SubStateType.STAKE_OWNERSHIP)(
			bufferReader,
		),
}

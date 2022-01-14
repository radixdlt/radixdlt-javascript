import { Result } from 'neverthrow'
import { SubStateType, StakeOwnershipT } from './_types'
import { BufferReaderT } from '@util'
import { makeBaseStakeSubstateFromBuffer } from './preparedStake'

export const StakeOwnership = {
  fromBufferReader: (
    bufferReader: BufferReaderT,
    lengthData: Buffer,
  ): Result<StakeOwnershipT, Error> =>
    makeBaseStakeSubstateFromBuffer(SubStateType.STAKE_OWNERSHIP)(
      bufferReader,
      lengthData,
    ),
}

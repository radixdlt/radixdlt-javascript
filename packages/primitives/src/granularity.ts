import { Denomination, Granularity } from './_types'
import { Amount } from './amount'
import { UInt256 } from '@radixdlt/uint256'

export const granularityDefault: Granularity = Amount.fromUInt256({
	magnitude: UInt256.valueOf(1),
	denomination: Denomination.Whole,
})._unsafeUnwrap()

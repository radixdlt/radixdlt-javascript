import { Denomination, Granularity } from './_types'
import { amountFromUInt256 } from './amount'
import { UInt256 } from '@radixdlt/uint256'

export const granularityDefault: Granularity = amountFromUInt256({
	magnitude: UInt256.valueOf(1),
	denomination: Denomination.Atto,
})._unsafeUnwrap()

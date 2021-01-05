import { UInt256 } from '@radixdlt/uint256'

export type Signature = {
	readonly r: UInt256
	readonly s: UInt256
}

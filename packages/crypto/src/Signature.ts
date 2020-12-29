import { UInt256 } from '@radixdlt/subatomic'

export type Signature = {
	readonly r: UInt256
	readonly s: UInt256
}

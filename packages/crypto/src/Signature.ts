import { UInt256 } from 'packages/primitives/dist'

export type Signature = {
	readonly r: UInt256
	readonly s: UInt256
}

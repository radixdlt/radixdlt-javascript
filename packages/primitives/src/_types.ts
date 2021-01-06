import { DSONCodable } from '@radixdlt/dson'

export type Magic = DSONCodable & {
	byte: () => number
}

import { DSONKeyValues } from './dson'
import { JSONKeyValues } from './json'

export type SerializableKeyValues = {
	[key: string]: DSONKeyValues[keyof DSONKeyValues] &
		JSONKeyValues[keyof JSONKeyValues]
}

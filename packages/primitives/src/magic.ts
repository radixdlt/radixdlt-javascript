import { firstByteOfNumber } from './byte'
import { Magic } from './_types'

export const magicFromNumber = (number: number): Magic => {
	return {
		byte: firstByteOfNumber(number),
	}
}

import { JSONEncodablePrimitive } from './_types'

export const isEmpty = (val: JSONEncodablePrimitive): boolean => {
	return (
		val === undefined ||
		val === null ||
		(Array.isArray(val) && val.length === 0) ||
		(Object.keys(val).length === 0 && val.constructor === Object)
	)
}
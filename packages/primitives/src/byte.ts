import { Byte } from './_types'
import { Result, err, ok } from 'neverthrow'

export const fitsInUInt8 = (number: number): boolean => {
	const isNotTooBig = number <= 255
	const isNonNegative = number > 0
	return isNotTooBig && isNonNegative
}

export const byteFromNumber = (n: number): Result<Byte, Error> => {
	if (!Number.isInteger(n) || !fitsInUInt8(n)) {
		return err(new RangeError('Number is out of Uint8 range'))
	}
	const byte = n as Byte
	return ok(byte)
}

export const byteToBuffer = (byte: Byte): Buffer => {
	return Buffer.from([byteToNumber(byte)])
}

const byteToNumber = (byte: Byte): number => {
	return byte as number
}

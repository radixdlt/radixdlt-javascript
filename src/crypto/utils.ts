import { err, ok, Result } from 'neverthrow'
import { log } from '@util'

const ensureNum = (num: number): void => {
	if (!num || Number.isNaN(num)) {
		log.error(`Expected number but got none or got NaN: ${num}`)
		throw new Error('Incorrect implementation, must get a number')
	}
}

export const validateMaxLength = (
	expectedMaxLength: number,
	name: string,
	buffer: Buffer,
): Result<Buffer, Error> => {
	ensureNum(expectedMaxLength)

	return buffer.length > expectedMaxLength
		? err(
				new Error(
					`Incorrect length of ${name}, expected max: #${expectedMaxLength} bytes, but got: #${buffer.length}.`,
				),
		  )
		: ok(buffer)
}

export const validateMinLength = (
	expectedMinLength: number,
	name: string,
	buffer: Buffer,
): Result<Buffer, Error> => {
	ensureNum(expectedMinLength)
	return buffer.length < expectedMinLength
		? err(
				new Error(
					`Incorrect length of ${name}, expected min: #${expectedMinLength} bytes, but got: #${buffer.length}.`,
				),
		  )
		: ok(buffer)
}

export const validateLength = (
	expectedLength: number,
	name: string,
	buffer: Buffer,
): Result<Buffer, Error> => {
	ensureNum(expectedLength)
	return buffer.length !== expectedLength
		? err(
				new Error(
					`Incorrect length of ${name}, expected: #${expectedLength} bytes, but got: #${buffer.length}.`,
				),
		  )
		: ok(buffer)
}

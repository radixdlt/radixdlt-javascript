import { err, ok, Result } from 'neverthrow'
import { BIP32PathComponent, Int32 } from './_types'
import { fromValue } from 'long'
import { Int64 } from '@radixdlt/primitives'


export const INT32_MAX_VALUE = 2_147_483_647
export const INT32_MIN_VALUE = -2_147_483_648

export const validateIndexValue = (index: number): Result<Int32, Error> => {
	if (!Number.isInteger(index))
		return err(new Error('Fatal error, non integers not allowed'))
	if (index > INT32_MAX_VALUE)
		return err(
			new Error(
				'Index larger than Int32 max value, which is not allowed',
			),
		)
	if (index < INT32_MIN_VALUE)
		return err(
			new Error(
				'Index smaller than Int32 min value, which is not allowed',
			),
		)
	return ok(index)
}

export const bip32Component = (
	input: Readonly<{
		index: Int32
		isHardened: boolean
		level: number
	}>,
): BIP32PathComponent => {
	if (!validateIndexValue(input.index).isOk()) {
		throw new Error(
			'Fatal error, expected an Int32 as input for index, but it is invalid.',
		)
	}

    const hardenedIncrement: Int64 = fromValue(0x80000000)
    const index: Int64 = fromValue(input.index)

	return {
		...input,
        index: input.isHardened ? index.add(hardenedIncrement) : index,
		toString: (): string => `${input.index}` + (input.isHardened ? `'` : '')
	}
}
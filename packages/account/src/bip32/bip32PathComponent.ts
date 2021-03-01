import { err, ok, Result } from 'neverthrow'
import { BIP32PathComponentT, Int32 } from './_types'
import { fromValue } from 'long'
import { Int64 } from '@radixdlt/primitives'
import { hardener, pathSeparator } from './bip32'

export const INT32_MAX_VALUE = 2_147_483_647
export const INT32_MIN_VALUE = -2_147_483_648

export const validateIndexValue = (index: number): Result<Int32, Error> =>
	!Number.isInteger(index)
		? err(new Error('Fatal error, non integers not allowed.'))
		: index > INT32_MAX_VALUE
		? err(new Error('Index larger than Int32 max value.'))
		: index < INT32_MIN_VALUE
		? err(new Error('Index smaller than Int32 min value.'))
		: ok(index)

const create = (
	input: Readonly<{
		index: Int32
		isHardened: boolean
		level: number
	}>,
): BIP32PathComponentT => {
	const validation = validateIndexValue(input.index)
	if (validation.isErr()) {
		throw new Error(
			'Fatal error, expected an Int32 as input for index, but it is invalid.',
		)
	}

	const hardenedIncrement: Int64 = fromValue(0x80000000)
	const index: Int64 = fromValue(input.index)

	return {
		...input,
		index: input.isHardened ? index.add(hardenedIncrement) : index,
		toString: (): string =>
			`${input.index}` + (input.isHardened ? `'` : ''),
	}
}

const fromString = (
	componentString: string,
	level: number,
): Result<BIP32PathComponentT, Error> => {
	if (componentString.includes(pathSeparator)) {
		return err(new Error('Path component contains separator'))
	}
	let component = componentString
	let isHardened = false
	if (component.endsWith(hardener)) {
		isHardened = true
		component = component.replace(hardener, '')
	}

	let parsedInt = undefined
	try {
		parsedInt = parseInt(component, 10)
	} catch (e) {
		return err(new Error('Failed to parse integer'))
	}
	if (!Number.isInteger(parsedInt)) {
		return err(new Error('Found no integer'))
	}

	return validateIndexValue(parsedInt).map((parsedIndex) => {
		const hardenedIncrement: Int64 = fromValue(0x80000000)
		const index: Int64 = fromValue(parsedIndex)

		return {
			level,
			isHardened,
			index: isHardened ? index.add(hardenedIncrement) : index,
			toString: (): string => `${parsedIndex}` + (isHardened ? `'` : ''),
		}
	})
}

export const BIP32PathComponent = {
	create,
	fromString,
}

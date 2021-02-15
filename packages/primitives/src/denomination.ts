import { Denomination, DenominationOutputFormat } from './_types'

export const name = (denomination: Denomination): string =>
	Denomination[denomination]

export const symbol = (denomination: Denomination): string => {
	switch (denomination) {
		case Denomination.Atto:
			return 'a'
		case Denomination.Femto:
			return 'f'
		case Denomination.Pico:
			return 'p'
		case Denomination.Nano:
			return 'n'
		case Denomination.Micro:
			return 'μ'
		case Denomination.Milli:
			return 'm'
		case Denomination.Whole:
			return ''
		case Denomination.Kilo:
			return 'k'
		case Denomination.Mega:
			return 'M'
		case Denomination.Giga:
			return 'G'
		case Denomination.Tera:
			return 'T'
		case Denomination.Peta:
			return 'P'
		case Denomination.Exa:
			return 'E'
	}
	return 'UNKNOWN'
}

export const formatDenomination = (
	input: Readonly<{
		outputFormat?: DenominationOutputFormat
		denomination: Denomination
	}>,
): string => {
	const denominationOutputFormat =
		input.outputFormat ?? DenominationOutputFormat.SHOW_EXPONENT_BASE_TEN
	const denomination = input.denomination
	switch (denominationOutputFormat) {
		case DenominationOutputFormat.OMIT:
			return ''
		case DenominationOutputFormat.SHOW_NAME:
			return name(denomination)
		case DenominationOutputFormat.SHOW_SYMBOL:
			return symbol(denomination)
		case DenominationOutputFormat.SHOW_EXPONENT_BASE_TEN:
			return denomination !== Denomination.Whole
				? `E${denomination.valueOf()}`
				: ''
	}
	return ''
}

export const denominations: Denomination[] = [
	Denomination.Exa,
	Denomination.Peta,
	Denomination.Tera,
	Denomination.Giga,
	Denomination.Mega,
	Denomination.Kilo,
	Denomination.Whole,
	Denomination.Milli,
	Denomination.Micro,
	Denomination.Nano,
	Denomination.Pico,
	Denomination.Femto,
	Denomination.Atto,
]

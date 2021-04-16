import { ValidatorAddressT } from './_types'
import { err, ok, Result } from 'neverthrow'
import { log, ValidationWitness } from '@radixdlt/util'

const validatedValidatorAddress = 'validated validator address'

export const isValidatorAddress = (
	something: unknown,
): something is ValidatorAddressT => {
	const inspection = something as ValidatorAddressT
	return (
		inspection.__isValidatorAddressWitness === validatedValidatorAddress &&
		inspection.equals !== undefined &&
		inspection.toString !== undefined
	)
}

type ValidatorAddressInput = string
const create = (addressString: ValidatorAddressInput): ValidatorAddressT => {
	const toString = (): string => addressString
	return {
		__isValidatorAddressWitness: validatedValidatorAddress,
		toString,
		equals: (other: ValidatorAddressT): boolean => {
			if (!isValidatorAddress(other)) {
				return false
			}
			return other.toString() === toString()
		},
	}
}

export type ValidatorAddressUnsafeInput = string

const isValidatorAddressUnsafeInput = (
	something: unknown,
): something is ValidatorAddressUnsafeInput => {
	return typeof something === 'string'
}

export type ValidatorAddressOrUnsafeInput =
	| ValidatorAddressUnsafeInput
	| ValidatorAddressT

export const isValidatorAddressOrUnsafeInput = (
	something: unknown,
): something is ValidatorAddressOrUnsafeInput =>
	isValidatorAddress(something) || isValidatorAddressUnsafeInput(something)

const validateAddressInput = (
	input: ValidatorAddressInput,
): Result<ValidationWitness, Error> => {
	const completelyArbitrarilyChosenMinLength = 3
	if (input.length < completelyArbitrarilyChosenMinLength) {
		const errMsg = `Validator address must not be shorter than ${completelyArbitrarilyChosenMinLength}`
		log.error(errMsg)
		return err(new Error(errMsg))
	}
	return ok({ witness: 'Validator address input is ok.' })
}

const fromUnsafe = (
	input: ValidatorAddressOrUnsafeInput,
): Result<ValidatorAddressT, Error> =>
	isValidatorAddress(input)
		? ok(input)
		: validateAddressInput(input).map((_) => create(input))

export const ValidatorAddress = {
	fromUnsafe,
}

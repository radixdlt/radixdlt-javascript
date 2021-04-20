import { ValidatorAddressT } from './_types'
import { ok, Result } from 'neverthrow'
import { isPublicKey, PublicKey, publicKeyFromBytes } from '@radixdlt/crypto'
import { Bech32, encbech32, Encoding } from './bech32'
import { log, msgFromError } from '@radixdlt/util'

export const isValidatorAddress = (
	something: unknown,
): something is ValidatorAddressT => {
	const inspection = something as ValidatorAddressT
	return (
		inspection.publicKey !== undefined &&
		isPublicKey(inspection.publicKey) &&
		inspection.equals !== undefined &&
		inspection.toString !== undefined
	)
}

const hrp = 'vb'
const maxLength = 300 // arbitrarily chosen
const encoding: Encoding = encbech32

const fromPublicKey = (publicKey: PublicKey): ValidatorAddressT => {
	const bytes = publicKey.asData({ compressed: true })
	const data = Bech32.convertDataToBech32(bytes)
	const encodingResult = Bech32.encode({ hrp, data, encoding, maxLength })

	if (!encodingResult.isOk()) {
		const errMsg = `Incorrect implementation, failed to Bech32 encode validator pubkey, underlying error: ${msgFromError(
			encodingResult.error,
		)}, but expect to always be able to.`
		console.log(errMsg)
		throw new Error(errMsg)
	}
	const encoded = encodingResult.value
	const toString = (): string => encoded.toString()
	return {
		toString,
		publicKey,
		equals: (other: ValidatorAddressT): boolean => {
			if (!isValidatorAddress(other)) {
				return false
			}
			return other.publicKey.equals(publicKey)
		},
	}
}

type ValidatorAddressInput = string
const fromString = (
	bechString: ValidatorAddressInput,
): Result<ValidatorAddressT, Error> => {
	return Bech32.decode({ bechString, encoding, maxLength })
		.andThen((decoded) => publicKeyFromBytes(decoded.data))
		.map(fromPublicKey)
		.map((va) => {
			if (va.toString().toLowerCase() !== bechString.toLowerCase()) {
				const errMsg = `Incorrect implementation, ValidatorAddress mismatch, passed in: ${bechString.toLowerCase()}, created: ${va
					.toString()
					.toLowerCase()}`
				log.error(errMsg)
				throw new Error(errMsg)
			}
			return va
		})
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

const fromUnsafe = (
	input: ValidatorAddressOrUnsafeInput,
): Result<ValidatorAddressT, Error> =>
	isValidatorAddress(input) ? ok(input) : fromString(input)

export const ValidatorAddress = {
	fromUnsafe,
	fromPublicKey,
}

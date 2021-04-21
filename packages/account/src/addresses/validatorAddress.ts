import { err, ok, Result } from 'neverthrow'
import { PublicKey } from '@radixdlt/crypto'
import { AddressTypeT, NetworkT, ValidatorAddressT } from '../_types'
import { Encoding } from '../bech32'
import { AbstractAddress, isAbstractAddress } from './abstractAddress'

export const isValidatorAddress = (
	something: unknown,
): something is ValidatorAddressT => {
	if (!isAbstractAddress(something)) return false
	return something.addressType === AddressTypeT.VALIDATOR
}

const hrpMainnet = 'vr'
const hrpBetanet = 'vb'
const maxLength = 300 // arbitrarily chosen
const encoding = Encoding.BECH32

const hrpFromNetwork = (network: NetworkT): string => {
	switch (network) {
		case NetworkT.BETANET:
			return hrpBetanet
		case NetworkT.MAINNET:
			return hrpMainnet
	}
}

const networkFromHRP = (hrp: string): Result<NetworkT, Error> => {
	if (hrp === hrpMainnet) return ok(NetworkT.MAINNET)
	if (hrp === hrpBetanet) return ok(NetworkT.BETANET)
	const errMsg = `Failed to parse network from HRP ${hrp} for ValidatorAddress.`
	return err(new Error(errMsg))
}

const fromPublicKeyAndNetwork = (
	input: Readonly<{
		publicKey: PublicKey
		network?: NetworkT
	}>,
): ValidatorAddressT =>
	AbstractAddress.create({
		...input,
		network: input.network ?? NetworkT.BETANET, // TODO Mainnet change to default to NetworkT.MAINNET before launch of mainnet.
		hrpFromNetwork,
		addressType: AddressTypeT.VALIDATOR,
		typeguard: isValidatorAddress,
		encoding,
		maxLength,
	})

const fromString = (bechString: string): Result<ValidatorAddressT, Error> =>
	AbstractAddress.fromString({
		bechString,
		addressType: AddressTypeT.VALIDATOR,
		typeguard: isValidatorAddress,
		networkFromHRP,
		encoding,
		maxLength,
	})

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
	fromPublicKeyAndNetwork,
}

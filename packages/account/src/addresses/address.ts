import { err, ok, Result } from 'neverthrow'
import { PublicKey } from '@radixdlt/crypto'
import { AddressT, AddressTypeT, NetworkT } from '../_types'
import { Bech32, Encoding } from '../bech32'
import {
	AbstractAddress,
	FormatDataToBech32Convert,
	HRPFromNetwork,
	isAbstractAddress,
	NetworkFromHRP,
	ValidateDataAndExtractPubKeyBytes,
} from './abstractAddress'
import { buffersEquals } from '@radixdlt/util'

export const isAccountAddress = (something: unknown): something is AddressT => {
	if (!isAbstractAddress(something)) return false
	return something.addressType === AddressTypeT.ACCOUNT
}

const hrpMainnet = 'rdx'
const hrpBetanet = 'brx'
const maxLength = 300 // arbitrarily chosen
const versionByte = Buffer.from([0x04])
const encoding = Encoding.BECH32

const hrpFromNetwork: HRPFromNetwork = (network) => {
	switch (network) {
		case NetworkT.BETANET:
			return hrpBetanet
		case NetworkT.MAINNET:
			return hrpMainnet
	}
}

const networkFromHRP: NetworkFromHRP = (hrp) => {
	if (hrp === hrpMainnet) return ok(NetworkT.MAINNET)
	if (hrp === hrpBetanet) return ok(NetworkT.BETANET)
	const errMsg = `Failed to parse network from HRP ${hrp} for ValidatorAddress.`
	return err(new Error(errMsg))
}

const formatDataToBech32Convert: FormatDataToBech32Convert = (data) =>
	Buffer.concat([versionByte, data])

// FORMER
// const validateDataAndExtractPubKeyBytes: ValidateDataAndExtractPubKeyBytes = (
// 	data: Buffer,
// ): Result<Buffer, Error> => {
// 	const receivedVersionByte = data.slice(0, 1)
// 	if (!buffersEquals(versionByte, receivedVersionByte)) {
// 		const errMsg = `Wrong version byte, expected '${versionByte.toString(
// 			'hex',
// 		)}', but got: '${receivedVersionByte.toString('hex')}'`
// 		console.error(errMsg)
// 		return err(new Error(errMsg))
// 	}
// 	return ok(data.slice(1, data.length))
// }

// LATTER
const validateDataAndExtractPubKeyBytes: ValidateDataAndExtractPubKeyBytes = (
	data: Buffer,
): Result<Buffer, Error> => {
	const receivedVersionByte = data.slice(0, 1)
	if (!buffersEquals(versionByte, receivedVersionByte)) {
		const errMsg = `Wrong version byte, expected '${versionByte.toString(
			'hex',
		)}', but got: '${receivedVersionByte.toString('hex')}'`
		console.error(errMsg)
		return err(new Error(errMsg))
	}
	const bech32Data = data.slice(1, data.length)
	const publicKeyBytes = Bech32.convertDataFromBech32(bech32Data)
	return ok(publicKeyBytes)
}

const fromPublicKeyAndNetwork = (
	input: Readonly<{
		publicKey: PublicKey
		network: NetworkT
	}>,
): AddressT =>
	AbstractAddress.create({
		...input,
		network: input.network,
		hrpFromNetwork,
		addressType: AddressTypeT.ACCOUNT,
		typeguard: isAccountAddress,
		formatDataToBech32Convert,
		encoding,
		maxLength,
	})

const fromString = (bechString: string): Result<AddressT, Error> =>
	AbstractAddress.fromString({
		bechString,
		addressType: AddressTypeT.ACCOUNT,
		networkFromHRP,
		typeguard: isAccountAddress,
		validateDataAndExtractPubKeyBytes,
		encoding,
		maxLength,
	})

export type AccountAddressUnsafeInput = string

const isAccountAddressUnsafeInput = (
	something: unknown,
): something is AccountAddressUnsafeInput => {
	return typeof something === 'string'
}

export type AddressOrUnsafeInput = AccountAddressUnsafeInput | AddressT

export const isAccountAddressOrUnsafeInput = (
	something: unknown,
): something is AddressOrUnsafeInput =>
	isAccountAddress(something) || isAccountAddressUnsafeInput(something)

const fromUnsafe = (input: AddressOrUnsafeInput): Result<AddressT, Error> =>
	isAccountAddress(input) ? ok(input) : fromString(input)

export const Address = {
	isAccountAddress,
	fromUnsafe,
	fromPublicKeyAndNetwork,
}

import { err, ok, Result } from 'neverthrow'
import { PublicKey } from '@radixdlt/crypto'
import { Encoding } from '../bech32'
import {
	AbstractAddress,
	FormatDataToBech32Convert,
	HRPFromNetwork,
	isAbstractAddress,
	NetworkFromHRP,
	ValidateDataAndExtractPubKeyBytes,
} from './abstractAddress'
import { buffersEquals } from '@radixdlt/util'
import { AccountAddressT, AddressTypeT, NetworkT } from './_types'

export const isSigningKeyAddress = (
	something: unknown,
): something is AccountAddressT => {
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
	return ok(data.slice(1, data.length))
}

const fromPublicKeyAndNetwork = (
	input: Readonly<{
		publicKey: PublicKey
		network: NetworkT
	}>,
): AccountAddressT =>
	AbstractAddress.byFormattingPublicKeyDataAndBech32ConvertingIt({
		...input,
		network: input.network,
		hrpFromNetwork,
		addressType: AddressTypeT.ACCOUNT,
		typeguard: isSigningKeyAddress,
		formatDataToBech32Convert,
		encoding,
		maxLength,
	})
		.orElse((e) => {
			throw new Error(
				`Expected to always be able to create signingKey address from publicKey and network, but got error: ${e.message}`,
			)
		})
		._unsafeUnwrap({ withStackTrace: true })

const fromString = (bechString: string): Result<AccountAddressT, Error> =>
	AbstractAddress.fromString({
		bechString,
		addressType: AddressTypeT.ACCOUNT,
		networkFromHRP,
		typeguard: isSigningKeyAddress,
		validateDataAndExtractPubKeyBytes,
		encoding,
		maxLength,
	})

export type SigningKeyAddressUnsafeInput = string

const isSigningKeyAddressUnsafeInput = (
	something: unknown,
): something is SigningKeyAddressUnsafeInput => {
	return typeof something === 'string'
}

export type AddressOrUnsafeInput = SigningKeyAddressUnsafeInput | AccountAddressT

export const isSigningKeyAddressOrUnsafeInput = (
	something: unknown,
): something is AddressOrUnsafeInput =>
	isSigningKeyAddress(something) || isSigningKeyAddressUnsafeInput(something)

const fromUnsafe = (
	input: AddressOrUnsafeInput,
): Result<AccountAddressT, Error> =>
	isSigningKeyAddress(input) ? ok(input) : fromString(input)

export const AccountAddress = {
	isSigningKeyAddress,
	fromUnsafe,
	fromPublicKeyAndNetwork,
}

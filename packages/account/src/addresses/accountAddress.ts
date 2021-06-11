import { err, ok, Result } from 'neverthrow'
import { PublicKey, PublicKeyT } from '@radixdlt/crypto'
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
import { AccountAddressT, AddressTypeT } from './_types'
import { NetworkT } from '@radixdlt/primitives'

export const isAccountAddress = (
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

const hrpFromNetwork: HRPFromNetwork = network => {
	switch (network) {
		case NetworkT.BETANET:
			return hrpBetanet
		case NetworkT.MAINNET:
			return hrpMainnet
	}
}

const networkFromHRP: NetworkFromHRP = hrp => {
	if (hrp === hrpMainnet) return ok(NetworkT.MAINNET)
	if (hrp === hrpBetanet) return ok(NetworkT.BETANET)
	const errMsg = `Failed to parse network from HRP ${hrp} for ValidatorAddress.`
	return err(new Error(errMsg))
}

const formatDataToBech32Convert: FormatDataToBech32Convert = data =>
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
		publicKey: PublicKeyT
		network: NetworkT
	}>,
): AccountAddressT =>
	AbstractAddress.byFormattingPublicKeyDataAndBech32ConvertingIt({
		...input,
		network: input.network,
		hrpFromNetwork,
		addressType: AddressTypeT.ACCOUNT,
		typeguard: isAccountAddress,
		formatDataToBech32Convert,
		encoding,
		maxLength,
	})
		.orElse(e => {
			throw new Error(
				`Expected to always be able to create AccountAddress from publicKey and network, but got error: ${e.message}`,
			)
		})
		._unsafeUnwrap({ withStackTrace: true })

const fromString = (bechString: string): Result<AccountAddressT, Error> =>
	AbstractAddress.fromString({
		bechString,
		addressType: AddressTypeT.ACCOUNT,
		networkFromHRP,
		typeguard: isAccountAddress,
		validateDataAndExtractPubKeyBytes,
		encoding,
		maxLength,
	})

const fromBuffer = (buffer: Buffer): Result<AccountAddressT, Error> => {
	const fromBuf = (buf: Buffer): Result<AccountAddressT, Error> =>
		PublicKey.fromBuffer(buf).map(publicKey =>
			fromPublicKeyAndNetwork({
				publicKey,
				network: NetworkT.BETANET, // yikes!
			}),
		)

	if (buffer.length === 34 && buffer[0] === 0x04) {
		const sliced = buffer.slice(1)
		if (length !== 33) {
			return err(new Error('Failed to slice buffer.'))
		}
		return fromBuf(sliced)
	} else if (buffer.length === 33) {
		return fromBuf(buffer)
	} else {
		return err(
			new Error(
				`Bad length of buffer, got #${buffer.length} bytes, but expected 33.`,
			),
		)
	}
}

export type AccountAddressUnsafeInput = string | Buffer

const isAccountAddressUnsafeInput = (
	something: unknown,
): something is AccountAddressUnsafeInput =>
	typeof something === 'string' || Buffer.isBuffer(something)

export type AddressOrUnsafeInput = AccountAddressUnsafeInput | AccountAddressT

export const isAccountAddressOrUnsafeInput = (
	something: unknown,
): something is AddressOrUnsafeInput =>
	isAccountAddress(something) || isAccountAddressUnsafeInput(something)

const fromUnsafe = (
	input: AddressOrUnsafeInput,
): Result<AccountAddressT, Error> =>
	isAccountAddress(input)
		? ok(input)
		: typeof input === 'string'
		? fromString(input)
		: fromBuffer(input)

export const AccountAddress = {
	isAccountAddress,
	fromUnsafe,
	fromPublicKeyAndNetwork,
}

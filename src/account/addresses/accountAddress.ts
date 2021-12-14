import { err, ok, Result } from 'neverthrow'
import { PublicKey, PublicKeyT } from '@crypto'
import { Encoding } from '../bech32'
import {
	AbstractAddress,
	FormatDataToBech32Convert,
	HRPFromNetwork,
	isAbstractAddress,
	NetworkFromHRP,
	ValidateDataAndExtractPubKeyBytes,
} from './abstractAddress'
import { buffersEquals } from '@util'
import { AccountAddressT, AddressTypeT } from './_types'
import { HRP, Network } from '@primitives'

export const isAccountAddress = (
	something: unknown,
): something is AccountAddressT => {
	if (!isAbstractAddress(something)) return false
	return something.addressType === AddressTypeT.ACCOUNT
}

const maxLength = 300 // arbitrarily chosen
const versionByte = Buffer.from([0x04])
const encoding = Encoding.BECH32

const hrpFromNetwork = (network: Network) => HRP[network].account

const networkFromHRP: NetworkFromHRP = hrp =>
	hrp === HRP.MAINNET.account
		? ok(Network.MAINNET)
		: hrp === HRP.stokenet.account
		? ok(Network.STOKENET)
		: hrp === HRP.LOCALHOST.account
		? ok(Network.LOCALHOST)
		: hrp === HRP.TESTNET3.account
		? ok(Network.TESTNET3)
		: hrp === HRP.TESTNET4.account
		? ok(Network.TESTNET4)
		: hrp === HRP.TESTNET5.account
		? ok(Network.TESTNET5)
		: hrp === HRP.TESTNET6.account
		? ok(Network.TESTNET6)
		: hrp === HRP.TESTNET7.account
		? ok(Network.TESTNET7)
		: err(
				Error(
					`Failed to parse network from HRP ${hrp} for AccountAddress.`,
				),
		  )

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
		network: Network
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
				network: Network.MAINNET, // yikes!
			}),
		)

	if (buffer.length === 34 && buffer[0] === 0x04) {
		const sliced = buffer.slice(1)
		if (sliced.length !== 33) {
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

export const isPrimitive = (
	something: unknown,
): something is AccountAddressUnsafeInput =>
	typeof something === 'string' || Buffer.isBuffer(something)

export type AddressOrUnsafeInput = AccountAddressUnsafeInput | AccountAddressT

export const isAccountAddressOrUnsafeInput = (
	something: unknown,
): something is AddressOrUnsafeInput =>
	isAccountAddress(something) || isPrimitive(something)

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

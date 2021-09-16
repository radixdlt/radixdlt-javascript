import { err, ok, Result } from 'neverthrow'
import { PublicKey, PublicKeyT } from '@radixdlt/crypto'
import { Encoding } from '../bech32'
import {
	AbstractAddress,
	HRPFromNetwork,
	isAbstractAddress,
	NetworkFromHRP,
} from './abstractAddress'
import { AddressTypeT, ValidatorAddressT } from './_types'
import { HRP, Network } from '@radixdlt/primitives'

export const isValidatorAddress = (
	something: unknown,
): something is ValidatorAddressT => {
	if (!isAbstractAddress(something)) return false
	return something.addressType === AddressTypeT.VALIDATOR
}

const maxLength = 300 // arbitrarily chosen
const encoding = Encoding.BECH32

const hrpFromNetwork = (network: Network) => HRP[network].validator

const networkFromHRP: NetworkFromHRP = hrp =>
	hrp === HRP.MAINNET.validator
		? ok(Network.MAINNET)
		: hrp === HRP.STOKENET.validator
		? ok(Network.STOKENET)
		: hrp === HRP.TESTNET3.validator
		? ok(Network.TESTNET3)
		: hrp === HRP.TESTNET4.validator
		? ok(Network.TESTNET4)
		: hrp === HRP.TESTNET5.validator
		? ok(Network.TESTNET5)
		: hrp === HRP.TESTNET6.validator
		? ok(Network.TESTNET6)
		: hrp === HRP.TESTNET7.validator
		? ok(Network.TESTNET7)
		: err(
				Error(
					`Failed to parse network from HRP ${hrp} for ValidatorAddress.`,
				),
		  )

const fromPublicKeyAndNetwork = (
	input: Readonly<{
		publicKey: PublicKeyT
		network: Network
	}>,
): ValidatorAddressT =>
	AbstractAddress.byFormattingPublicKeyDataAndBech32ConvertingIt({
		...input,
		network: input.network,
		hrpFromNetwork,
		addressType: AddressTypeT.VALIDATOR,
		typeguard: isValidatorAddress,
		encoding,
		maxLength,
	})
		.orElse(e => {
			throw new Error(
				`Expected to always be able to create validator address from publicKey and network, but got error: ${e.message}`,
			)
		})
		._unsafeUnwrap({ withStackTrace: true })

const fromString = (bechString: string): Result<ValidatorAddressT, Error> =>
	AbstractAddress.fromString({
		bechString,
		addressType: AddressTypeT.VALIDATOR,
		typeguard: isValidatorAddress,
		networkFromHRP,
		encoding,
		maxLength,
	})

const fromBuffer = (buffer: Buffer): Result<ValidatorAddressT, Error> => {
	const fromBuf = (buf: Buffer): Result<ValidatorAddressT, Error> =>
		PublicKey.fromBuffer(buf).map(publicKey =>
			fromPublicKeyAndNetwork({
				publicKey,
				network: Network.MAINNET, // should change
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

export type ValidatorAddressUnsafeInput = string | Buffer

const isValidatorAddressUnsafeInput = (
	something: unknown,
): something is ValidatorAddressUnsafeInput =>
	typeof something === 'string' || Buffer.isBuffer(something)

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
	isValidatorAddress(input)
		? ok(input)
		: typeof input === 'string'
		? fromString(input)
		: fromBuffer(input)

export const ValidatorAddress = {
	fromUnsafe,
	fromPublicKeyAndNetwork,
}

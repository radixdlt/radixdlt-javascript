import { combine, ok, Result } from 'neverthrow'
import { isPublicKey, PublicKey, publicKeyFromBytes } from '@radixdlt/crypto'
import { log, msgFromError } from '@radixdlt/util'
import { AbstractAddressT, AddressTypeT, NetworkT } from '../_types'
import { Bech32, Encoding } from '../bech32'

export const isAbstractAddress = (
	something: unknown,
): something is AbstractAddressT => {
	const inspection = something as AbstractAddressT
	return (
		inspection.publicKey !== undefined &&
		isPublicKey(inspection.publicKey) &&
		inspection.equals !== undefined &&
		inspection.toString !== undefined &&
		inspection.addressType !== undefined
	)
}

export type TypeGuard<A extends AbstractAddressT> = (
	something: unknown,
) => something is A

export type NetworkFromHRP = (hrp: string) => Result<NetworkT, Error>
export type HRPFromNetwork = (network: NetworkT) => string
export type FormatDataToBech32Convert = (publicKeyBytes: Buffer) => Buffer

export type ValidateDataAndExtractPubKeyBytes = (
	data: Buffer,
) => Result<Buffer, Error>

const create = <A extends AbstractAddressT>(
	input: Readonly<{
		publicKey: PublicKey
		hrpFromNetwork: HRPFromNetwork
		addressType: AddressTypeT
		network: NetworkT
		typeguard: TypeGuard<A>
		formatDataToBech32Convert?: FormatDataToBech32Convert
		encoding?: Encoding
		maxLength?: number
	}>,
): A => {
	const {
		publicKey,
		encoding,
		maxLength,
		hrpFromNetwork,
		addressType,
		network,
		typeguard,
	} = input

	const formatDataToBech32Convert =
		input.formatDataToBech32Convert ?? ((b) => b)

	// FORMER
	// const publicKeyBytes = publicKey.asData({ compressed: true })
	// const bytes = formatDataToBech32Convert(publicKeyBytes)
	// const data = Bech32.convertDataToBech32(bytes)

	// LATTER
	const publicKeyBytes = publicKey.asData({ compressed: true })
	const bytes = Bech32.convertDataToBech32(publicKeyBytes)
	const data = formatDataToBech32Convert(bytes)

	const hrp = hrpFromNetwork(network)
	const encodingResult = Bech32.encode({ hrp, data, encoding, maxLength })

	if (!encodingResult.isOk()) {
		const errMsg = `Incorrect implementation, failed to Bech32 encode validator pubkey, underlying error: ${msgFromError(
			encodingResult.error,
		)}, but expect to always be able to.`
		console.error(errMsg)
		throw new Error(errMsg)
	}
	const encoded = encodingResult.value
	const toString = (): string => encoded.toString()

	const equals = (other: AbstractAddressT): boolean => {
		if (!isAbstractAddress(other)) {
			return false
		}
		return (
			other.publicKey.equals(publicKey) &&
			other.network === network &&
			addressType === other.addressType
		)
	}

	const abstract: AbstractAddressT = {
		addressType,
		network,
		publicKey,
		toString,
		equals,
	}

	if (!typeguard(abstract)) {
		const errMsg = `Incorrect implementation, expected to have created an address of type ${addressType.toString()}`
		log.error(errMsg)
		throw new Error(errMsg)
	}

	return abstract
}

const fromString = <A extends AbstractAddressT>(
	input: Readonly<{
		bechString: string
		addressType: AddressTypeT
		networkFromHRP: NetworkFromHRP
		typeguard: TypeGuard<A>
		validateDataAndExtractPubKeyBytes?: ValidateDataAndExtractPubKeyBytes
		encoding?: Encoding
		maxLength?: number
	}>,
): Result<A, Error> => {
	const {
		bechString,
		encoding,
		maxLength,
		networkFromHRP,
		typeguard,
		addressType,
	} = input

	return Bech32.decode({ bechString, encoding, maxLength })
		.andThen(
			({ hrp, data: bech32Data }): Result<A, Error> => {
				// FORMER
				// const validateDataAndExtractPubKeyBytes =
				// 	input.validateDataAndExtractPubKeyBytes ?? ((data: Buffer) => ok(data))
				// const data = Bech32.convertDataFromBech32(bech32Data)
				// return validateDataAndExtractPubKeyBytes(data).andThen(
				// 	(publicKeyBytes) => {
				// 		return combine([
				// 			networkFromHRP(hrp),
				// 			publicKeyFromBytes(publicKeyBytes),
				// 		]).map(
				// 			(resultList): A => {
				// 				const network = resultList[0] as NetworkT
				// 				const publicKey = resultList[1] as PublicKey

				// LATTER
				const validateDataAndExtractPubKeyBytes =
					input.validateDataAndExtractPubKeyBytes ??
					((data: Buffer) => ok(Bech32.convertDataFromBech32(data)))

				return validateDataAndExtractPubKeyBytes(bech32Data).andThen(
					(publicKeyBytes) => {
						return combine([
							networkFromHRP(hrp),
							publicKeyFromBytes(publicKeyBytes),
						]).map(
							(resultList): A => {
								const network = resultList[0] as NetworkT
								const publicKey = resultList[1] as PublicKey

								return create({
									addressType,
									publicKey,
									hrpFromNetwork: (_) => hrp,
									network,
									typeguard,
									formatDataToBech32Convert: (_) =>
										bech32Data,
									encoding,
									maxLength,
								})
							},
						)
					},
				)
			},
		)
		.map((va) => {
			if (va.toString().toLowerCase() !== bechString.toLowerCase()) {
				const errMsg = `Incorrect implementation, AbstractAddress mismatch, passed in: ${bechString.toLowerCase()}, created: ${va
					.toString()
					.toLowerCase()}`
				log.error(errMsg)
				throw new Error(errMsg)
			}
			return va
		})
}

export const AbstractAddress = {
	create,
	fromString,
}

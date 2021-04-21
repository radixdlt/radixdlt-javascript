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

const create = <A extends AbstractAddressT>(
	input: Readonly<{
		publicKey: PublicKey
		hrpFromNetwork: (network: NetworkT) => string
		addressType: AddressTypeT
		network: NetworkT
		typeguard: (something: unknown) => something is A
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

	const bytes = publicKey.asData({ compressed: true })
	const data = Bech32.convertDataToBech32(bytes)
	const hrp = hrpFromNetwork(network)
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
		networkFromHRP: (hrp: string) => Result<NetworkT, Error>
		typeguard: (something: unknown) => something is A
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
			({ hrp, data: pubKeyBech32Data }): Result<A, Error> => {
				const publicKeyBytes = Bech32.convertDataFromBech32(
					pubKeyBech32Data,
				)

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
							encoding,
							maxLength,
						})
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

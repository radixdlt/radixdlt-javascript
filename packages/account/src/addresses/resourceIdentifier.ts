import { err, ok, Result } from 'neverthrow'
import { buffersEquals, msgFromError } from '@radixdlt/util'
import { PublicKeyT, sha256Twice } from '@radixdlt/crypto'
import { Bech32, Encoding } from '../bech32'
import { NetworkT, ResourceIdentifierT } from './_types'
import { HRPFromNetwork, NetworkFromHRP } from './abstractAddress'

const encoding = Encoding.BECH32
const maxLength: number | undefined = undefined // arbitrarily chosen

const hrpSuffixBetanet = 'b'
const hrpSuffixMainnet = 'r'
const hrpSuffixSharedFirstPart = '_r'
const hrpSuffixLengthOfSpecificPart = 1
const hrpFullSuffixLength = 3

const internalSanityCheckOfHRP = (): void => {
	if (hrpSuffixBetanet.length !== hrpSuffixMainnet.length) {
		throw new Error(
			'Incorrect implementation, HRP suffix must have same length for mainnet and betanet',
		)
	}
	if (hrpSuffixMainnet.length !== hrpSuffixLengthOfSpecificPart) {
		// or `hrpSuffixBetanet.length`...does not matter, same length!
		throw new Error(
			`Incorrect implementation, expected specific part of HRP to have length ${hrpSuffixLengthOfSpecificPart}`,
		)
	}

	const combined = hrpSuffixSharedFirstPart + hrpSuffixMainnet // or ` + hrpSuffixBetanet`...does not matter, same length!
	if (combined.length !== hrpFullSuffixLength) {
		throw new Error(
			`Incorrect implementation, expected HRP suffixes to have length ${hrpFullSuffixLength}`,
		)
	}
	// all is well
}

const versionByteNativeToken = 0x01
const versionByteNonNativeToken = 0x03

const hrpSuffixFromNetwork: HRPFromNetwork = (network) => {
	internalSanityCheckOfHRP()
	let specificLastPart: string = ''
	switch (network) {
		case NetworkT.BETANET:
			specificLastPart = hrpSuffixBetanet
			break
		case NetworkT.MAINNET:
			specificLastPart = hrpSuffixMainnet
			break
	}
	const fullSuffix = hrpSuffixSharedFirstPart + specificLastPart
	if (fullSuffix.length !== hrpFullSuffixLength) {
		throw new Error('Incorrect implementation, wrong length of HRP suffix')
	}
	return fullSuffix
}

const networkFromHRPSuffix: NetworkFromHRP = (hrp) => {
	internalSanityCheckOfHRP()

	if (hrp.length < hrpSuffixLengthOfSpecificPart) {
		throw new Error(
			`Incorrect implementation, HRP suffix specific part must not be shorter than ${hrpSuffixLengthOfSpecificPart}`,
		)
	}
	const hrpLastPart =
		hrp.length !== hrpSuffixLengthOfSpecificPart
			? hrp.slice(-hrpSuffixLengthOfSpecificPart)
			: hrp
	if (hrpLastPart === hrpSuffixMainnet) return ok(NetworkT.MAINNET)
	if (hrpLastPart === hrpSuffixBetanet) return ok(NetworkT.BETANET)
	const errMsg = `Failed to parse network from HRP ${hrp} for ValidatorAddress.`
	return err(new Error(errMsg))
}

const __create = (input: {
	hash: Buffer
	name: string
	network: NetworkT
	toString: () => string
}): ResourceIdentifierT => {
	return {
		...input,
		__witness: 'isRRI',
		equals: (other): boolean => {
			if (!isResourceIdentifier(other)) return false
			const same =
				other.name === input.name &&
				buffersEquals(other.hash, input.hash) &&
				input.network === other.network
			if (same) {
				if (other.toString() !== input.toString()) {
					const errMsg = `ResourceIdentifiers believed to be equal, but return different values when calling toString, (this)'${input.toString()}' vs other: '${other.toString()}'`
					console.error(errMsg)
					throw new Error(errMsg)
				}
			}
			return same
		},
	}
}

const fromBech32String = (
	bechString: string,
): Result<ResourceIdentifierT, Error> => {
	// const hrpSuffix = hrpBetanetSuffix // TODO make dependent on Network!

	const decodingResult = Bech32.decode({ bechString, encoding, maxLength })

	if (!decodingResult.isOk()) {
		const errMsg = `Failed to Bech32 decode RRI, underlying error: ${msgFromError(
			decodingResult.error,
		)}, but expect to always be able to.`
		return err(new Error(errMsg))
	}
	const decoded = decodingResult.value
	const hrp = decoded.hrp

	if (!(hrp.endsWith(hrpSuffixBetanet) || hrp.endsWith(hrpSuffixMainnet))) {
		const errMsg = `The prefix (HRP: Human Readable Part) of a Resource identifier must end with suffix '_${hrpSuffixBetanet}' or '_${hrpSuffixMainnet}'`
		return err(new Error(errMsg))
	}
	const nameToValidate = hrp.slice(0, hrp.length - hrpFullSuffixLength)
	const hrpSuffix = hrp.slice(hrpFullSuffixLength)
	const networkResult = networkFromHRPSuffix(hrpSuffix)

	if (!networkResult.isOk()) {
		const errMsg = `Expected to get network from HRP suffix '${hrpSuffix}', but failed to get it.`
		return err(new Error(errMsg))
	}
	const network = networkResult.value

	const nameValidationResult = validateCharsInName(nameToValidate)

	if (!nameValidationResult.isOk()) {
		return err(nameValidationResult.error)
	}
	const name = nameValidationResult.value

	const processed = decoded.data
	const combinedDataResult = Bech32.convertDataFromBech32(processed)

	if (!combinedDataResult.isOk()) {
		const errMsg = `Failed to convertDataFromBech32 data, underlying error: ${msgFromError(
			combinedDataResult.error,
		)}`
		console.error(errMsg)
		return err(new Error(errMsg))
	}

	const combinedData = combinedDataResult.value

	if (combinedData.length === 0) {
		const errMsg = `The data part of RRI should NEVER be empty, must at least contain 1 version byte ('${versionByteNativeToken}' for native token, or '${versionByteNonNativeToken}' for other tokens)`
		console.error(errMsg)
		return err(new Error(errMsg))
	}

	const versionByte = combinedData[0]

	if (
		!(
			versionByte === versionByteNativeToken ||
			versionByte === versionByteNonNativeToken
		)
	) {
		const errMsg = `The version byte must be either: '${versionByteNativeToken}' for native token, or '${versionByteNonNativeToken}' for other tokens, but got: ${versionByte}, bechString: '${bechString}'`
		console.error(errMsg)
		return err(new Error(errMsg))
	}

	const isNativeToken = versionByte === versionByteNativeToken

	if (isNativeToken) {
		if (combinedData.length > 1) {
			const errMsg = `Expected data to be empty for native token, but got: #${
				combinedData.length - 1 // minus 1 because we substract the 'versionByte'
			} bytes`
			console.error(errMsg)
			return err(new Error(errMsg))
		}
	} else {
		if (combinedData.length <= 1) {
			const errMsg = `Expected data to be non empty for non native token`
			console.error(errMsg)
			return err(new Error(errMsg))
		}
	}

	return ok(
		__create({
			hash: combinedData,
			network,
			name,
			toString: () => bechString,
		}),
	)
}

const validateCharsInName = (name: string): Result<string, Error> => {
	const regexLowerAlphaNumerics = new RegExp('^[a-z0-9]+$')
	if (!regexLowerAlphaNumerics.test(name)) {
		const errMsg = `Illegal characters found in name`
		// console.error(errMsg)
		return err(new Error(errMsg))
	}
	return ok(name)
}

const withNameRawDataAndVersionByte = (
	input: Readonly<{
		hash: Buffer
		network: NetworkT
		versionByte: number
		name: string
	}>,
): Result<ResourceIdentifierT, Error> => {
	const { versionByte, hash, network } = input
	const hrpSuffix = hrpSuffixFromNetwork(network)

	return validateCharsInName(input.name).andThen((name) => {
		const hrp = `${name}${hrpSuffix}`

		const combinedData = Buffer.concat([Buffer.from([versionByte]), hash])

		return Bech32.convertDataToBech32(combinedData)
			.andThen((processed) => {
				return Bech32.encode({
					data: processed,
					hrp,
					encoding,
					maxLength,
				})
			})
			.map((bech32) => {
				return __create({
					hash,
					network,
					name,
					toString: () => bech32.toString(),
				})
			})
	})
}

const systemRRIForNetwork = (
	input: Readonly<{
		name: string
		network: NetworkT
	}>,
): Result<ResourceIdentifierT, Error> =>
	withNameRawDataAndVersionByte({
		...input,
		versionByte: versionByteNativeToken,
		hash: Buffer.alloc(0),
	})

const hashByteCount = 26

const pkToHash = (
	input: Readonly<{
		name: string
		publicKey: PublicKeyT
	}>,
): Buffer => {
	const { name, publicKey } = input
	const nameBytes = Buffer.from(name, 'utf8')
	const pubKeyBytes = publicKey.asData({ compressed: true })
	const dataToHash = Buffer.concat([pubKeyBytes, nameBytes])
	const hash = sha256Twice(dataToHash)
	return hash.slice(-hashByteCount) // last bytes
}

const fromPublicKeyAndNameAndNetwork = (
	input: Readonly<{
		publicKey: PublicKeyT
		name: string
		network: NetworkT
	}>,
): Result<ResourceIdentifierT, Error> =>
	withNameRawDataAndVersionByte({
		...input,
		versionByte: versionByteNonNativeToken,
		hash: pkToHash(input),
	})

export const isResourceIdentifier = (
	something: ResourceIdentifierT | unknown,
): something is ResourceIdentifierT => {
	const inspection = something as ResourceIdentifierT
	return (
		// inspection.hash !== undefined &&
		inspection.__witness !== undefined &&
		inspection.__witness === 'isRRI' &&
		inspection.name !== undefined &&
		inspection.toString !== undefined &&
		inspection.equals !== undefined
	)
}
export type ResourceIdentifierUnsafeInput = string

export const isResourceIdentifierUnsafeInput = (
	something: unknown,
): something is ResourceIdentifierUnsafeInput => typeof something === 'string'

export type ResourceIdentifierOrUnsafeInput =
	| ResourceIdentifierT
	| ResourceIdentifierUnsafeInput

export const isResourceIdentifierOrUnsafeInput = (
	something: unknown,
): something is ResourceIdentifierOrUnsafeInput =>
	isResourceIdentifier(something) ||
	isResourceIdentifierUnsafeInput(something)

const fromUnsafe = (
	input: ResourceIdentifierOrUnsafeInput,
): Result<ResourceIdentifierT, Error> => {
	return isResourceIdentifier(input) ? ok(input) : fromBech32String(input)
}

export const ResourceIdentifier = {
	systemRRIForNetwork,
	fromPublicKeyAndNameAndNetwork,
	fromUnsafe,
}

import { err, ok, Result } from 'neverthrow'
import { buffersEquals, msgFromError } from '@radixdlt/util'
import { PublicKey, sha256Twice } from '@radixdlt/crypto'
import { Bech32, Encoding } from './bech32'
import { ResourceIdentifierT } from './_types'

const encoding = Encoding.BECH32
const maxLength: number | undefined = undefined // arbitrarily chosen

const hrpBetanetSuffix = '_rb'
const hrpMainnetSuffix = '_rr'

const versionByteNativeToken = 0x01
const versionByteNonNativeToken = 0x03

const __create = (input: {
	hash: Buffer
	name: string
	toString: () => string
}): ResourceIdentifierT => {
	return {
		...input,
		__witness: 'isRRI',
		equals: (other): boolean => {
			if (!isResourceIdentifier(other)) return false
			const same =
				other.name === input.name &&
				buffersEquals(other.hash, input.hash)
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
	const hrpSuffix = hrpBetanetSuffix // TODO make dependent on Network!

	const decodingResult = Bech32.decode({ bechString, encoding, maxLength })

	if (!decodingResult.isOk()) {
		const errMsg = `Failed to Bech32 decode RRI, underlying error: ${msgFromError(
			decodingResult.error,
		)}, but expect to always be able to.`
		return err(new Error(errMsg))
	}
	const decoded = decodingResult.value
	const hrp = decoded.hrp

	if (!hrp.endsWith(hrpSuffix)) {
		const errMsg = `The prefix (HRP: Human Readable Part) of a Resource identifier must end with suffix ${hrpSuffix}`
		return err(new Error(errMsg))
	}

	const nameToValidate = hrp.slice(0, hrp.length - hrpSuffix.length)

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

	let hash: Buffer

	if (isNativeToken) {
		if (combinedData.length > 1) {
			const errMsg = `Expected data to be empty for native token, but got: #${
				combinedData.length - 1 // minus 1 because we substract the 'versionByte'
			} bytes`
			console.error(errMsg)
			return err(new Error(errMsg))
		}

		hash = Buffer.alloc(0)
	} else {
		if (combinedData.length <= 1) {
			const errMsg = `Expected data to be non empty for non native token`
			console.error(errMsg)
			return err(new Error(errMsg))
		}

		hash = combinedData.slice(1, combinedData.length)
		if (hash.length !== combinedData.length - 1) {
			throw new Error('incorrect impl, bad slice of data')
		}
	}

	return ok(
		__create({
			hash: combinedData,
			name,
			toString: () => bechString,
		}),
	)
}

const validateCharsInName = (name: string): Result<string, Error> => {
	const regexLowerAlphaNumerics = new RegExp('^[a-z0-9]+$')
	if (!regexLowerAlphaNumerics.test(name)) {
		const errMsg = `Illegal characters found in name`
		console.log(errMsg)
		return err(new Error(errMsg))
	}
	return ok(name)
}

const withNameRawDataAndVersionByte = (
	input: Readonly<{
		hash: Buffer
		versionByte: number
		name: string
	}>,
): Result<ResourceIdentifierT, Error> => {
	return validateCharsInName(input.name).andThen((name) => {

		const hrpSuffix = hrpBetanetSuffix // TODO make dependent on Network!

		const { versionByte, hash } = input
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
					name,
					toString: () => bech32.toString(),
				})
			})
	})
}

const systemRRI = (name: string): Result<ResourceIdentifierT, Error> =>
	withNameRawDataAndVersionByte({
		name,
		versionByte: versionByteNativeToken,
		hash: Buffer.alloc(0),
	})

const hashByteCount = 26

const pkToHash = (
	input: Readonly<{
		name: string
		publicKey: PublicKey
	}>,
): Buffer => {
	const { name, publicKey } = input
	const nameBytes = Buffer.from(name, 'utf8')
	const pubKeyBytes = publicKey.asData({ compressed: true })
	const dataToHash = Buffer.concat([pubKeyBytes, nameBytes])
	const hash = sha256Twice(dataToHash)
	return hash.slice(-hashByteCount) // last bytes
}

const fromPublicKeyAndName = (
	input: Readonly<{
		publicKey: PublicKey
		name: string
	}>,
): Result<ResourceIdentifierT, Error> =>
	withNameRawDataAndVersionByte({
		name: input.name,
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
	systemRRI,
	fromPublicKeyAndName,
	fromUnsafe,
}

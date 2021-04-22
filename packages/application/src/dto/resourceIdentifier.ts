import { err, ok, Result } from 'neverthrow'
import { ResourceIdentifierT } from './_types'
import { buffersEquals, msgFromError } from '@radixdlt/util'
import { Bech32, Encoding } from '@radixdlt/account'
import { PublicKey, sha256Twice } from '@radixdlt/crypto'

const encoding = Encoding.BECH32
const maxLength: number | undefined = undefined // arbitrarily chosen

const hrpSuffix = '_rr'

const versionByteNativeToken = 0x01 //Buffer.from([0x01])
const versionByteNonNativeToken = 0x03 //Buffer.from([0x03])

const __create = (input: {
	hash: Buffer
	name: string
	toString: () => string
}): ResourceIdentifierT => {
	return {
		...input,
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
	const decodingResult = Bech32.decode({ bechString, encoding, maxLength })

	if (!decodingResult.isOk()) {
		const errMsg = `Failed to Bech32 decode RRI, underlying error: ${msgFromError(
			decodingResult.error,
		)}, but expect to always be able to.`
		// console.error(errMsg)
		return err(new Error(errMsg))
	}
	const decoded = decodingResult.value
	const hrp = decoded.hrp

	if (!hrp.endsWith(hrpSuffix)) {
		const errMsg = `The prefix (HRP: Human Readable Part) of a Resource identifier must end with suffix ${hrpSuffix}`
		// console.error(errMsg)
		return err(new Error(errMsg))
	}

	const name = hrp.slice(0, hrp.length - hrpSuffix.length)

	const hashWithPrefixResult = Bech32.convertDataFromBech32(decoded.data)

	if (!hashWithPrefixResult.isOk()) {
		const errMsg = `Failed to convertDataFromBech32 data, underlying error: ${msgFromError(
			hashWithPrefixResult.error,
		)}`
		console.error(errMsg)
		return err(new Error(errMsg))
	}

	const hashWithPrefix = hashWithPrefixResult.value

	if (hashWithPrefix.length === 0) {
		const errMsg = `The data part of RRI should NEVER be empty, must at least contain 1 version byte ('${versionByteNativeToken}' for native token, or '${versionByteNonNativeToken}' for other tokens)`
		console.error(errMsg)
		return err(new Error(errMsg))
	}

	const versionByte = hashWithPrefix[0]

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
		if (hashWithPrefix.length > 1) {
			const errMsg = `Expected data to be empty for native token, but got: #${
				hashWithPrefix.length - 1 // minus 1 because we substract the 'versionByte'
			} bytes`
			console.error(errMsg)
			return err(new Error(errMsg))
		}

		hash = Buffer.alloc(0)
	} else {
		if (hashWithPrefix.length <= 1) {
			const errMsg = `Expected data to be non empty for non native token`
			console.error(errMsg)
			return err(new Error(errMsg))
		}

		const data = hashWithPrefix.slice(1, hashWithPrefix.length)
		if (data.length !== hashWithPrefix.length - 1) {
			throw new Error('incorrect impl, bad slice of data')
		}

		const hashResult = Bech32.convertDataFromBech32(data)

		if (!hashResult.isOk()) {
			return err(hashResult.error)
		}
		hash = hashResult.value
	}

	return ok(__create({ hash, name, toString: () => bechString }))
}

const withNameRawDataAndVersionByte = (
	input: Readonly<{
		rawData: Buffer
		versionByte: number
		name: string
	}>,
): Result<ResourceIdentifierT, Error> => {
	const { versionByte, name, rawData } = input
	const hrp = `${name}${hrpSuffix}`

	const dataToConvert = Buffer.concat([Buffer.from([versionByte]), rawData])

	return Bech32.convertDataToBech32(dataToConvert)
		.andThen((data) => {
			return Bech32.encode({
				data,
				hrp,
				encoding,
				maxLength,
			})
		})
		.map((bech32) => {
			return __create({
				hash: rawData,
				name,
				toString: () => bech32.toString(),
			})
		})
		.map((rri) => {
			// soundness check
			const roundtrip = fromUnsafe(rri.toString())
			if (!roundtrip.isOk()) {
				const errMsg = `Soundness check failed, error ${msgFromError(
					roundtrip.error,
				)}`
				console.log(errMsg)
				throw new Error(errMsg)
			}
			if (roundtrip.value.toString() !== rri.toString()) {
				const errMsg = `Soundness check failed strings differ...`
				console.log(errMsg)
				throw new Error(errMsg)
			}
			return rri
		})
}

const systemRRI = (name: string): Result<ResourceIdentifierT, Error> =>
	withNameRawDataAndVersionByte({
		name,
		versionByte: versionByteNativeToken,
		rawData: Buffer.alloc(0),
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
	const dataToHash = Buffer.concat([nameBytes, pubKeyBytes])
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
		rawData: pkToHash(input),
	})

export const isResourceIdentifier = (
	something: ResourceIdentifierT | unknown,
): something is ResourceIdentifierT => {
	const inspection = something as ResourceIdentifierT
	return (
		inspection.hash !== undefined &&
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

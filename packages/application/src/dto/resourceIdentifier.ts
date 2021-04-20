import { err, ok, Result } from 'neverthrow'
import { ResourceIdentifierT } from './_types'
import { buffersEquals, msgFromError } from '@radixdlt/util'
import { Address, Bech32, encbech32, Encoding } from '@radixdlt/account'

const encoding: Encoding = encbech32
const maxLength: number | undefined = undefined // arbitrarily chosen

const hrpSuffix = '_rr'

const create = (input: { hash: Buffer; name: string }): ResourceIdentifierT => {
	const { hash, name } = input

	const toString = (): string => {
		const data = hash.length !== 0 ? Bech32.convertDataToBech32(hash) : hash
		const hrp = `${name}${hrpSuffix}`
		const bech32Result = Bech32.encode({ hrp, data, encoding, maxLength })

		if (!bech32Result.isOk()) {
			const errMsg = `Incorrect implementation, failed to Bech32 encode RRI, underlying error: ${msgFromError(
				bech32Result.error,
			)}, but expect to always be able to.`
			console.log(errMsg)
			throw new Error(errMsg)
		}

		return bech32Result.value.toString()
	}

	return {
		hash,
		name,
		toString,
		equals: (other): boolean => {
			if (!isResourceIdentifier(other)) return false
			return other.name === name && buffersEquals(other.hash, hash)
		},
	}
}

const systemRRI = (name: string): ResourceIdentifierT =>
	create({ hash: Buffer.alloc(0), name })

const fromSpecString = (
	identifierString: string,
): Result<ResourceIdentifierT, Error> => {
	const separator = '/'
	const components = identifierString.split(separator)
	if (components.length !== 3) return err(new Error('Invalid RRI string'))
	if (components[0].length !== 0)
		return err(new Error(`Expected leading ${separator}`))
	const name = components[2].toLowerCase()
	if (name.length === 0) return err(new Error('Expected non empty name'))

	const regExpStr = '^[a-z0-9]+$'
	const regExp = new RegExp(regExpStr)
	if (!regExp.test(name)) {
		const errMsg = `RRI name is invalid, got ${name}, which does not match regexp: ${regExpStr}`
		console.log(errMsg)
		throw new Error(errMsg)
	}
	if (components[1].length === 0) {
		return ok(systemRRI(name))
	} else {
		return Address.fromBase58String(components[1]).map((a) =>
			create({ hash: a.publicKey.asData({ compressed: true }), name }),
		)
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
		console.log(errMsg)
		return err(new Error(errMsg))
	}
	const d = decodingResult.value
	let hash = d.data
	const hrp = d.hrp
	if (hash.length > 0) {
		try {
			hash = Bech32.convertDataFromBech32(hash)
		} catch (e) {
			const underlyingErrorMsg = msgFromError(e)
			const errMsg = `Failed to convert data from bech32 data, underlying error: ${underlyingErrorMsg}, hash: '${hash.toString(
				'hex',
			)}'`
			console.log(errMsg)
			return err(new Error(errMsg))
		}
	}
	if (!hrp.endsWith(hrpSuffix)) {
		const errMsg = `The prefix (HRP: Human Readable Part) of a Resource identifier must end with suffix ${hrpSuffix}`
		console.log(errMsg)
		return err(new Error(errMsg))
	}

	const name = hrp.slice(0, hrp.length - 3)

	return ok(create({ hash, name }))
}

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

const fromString = (string: string): Result<ResourceIdentifierT, Error> => {
	const bechStringResult = fromBech32String(string)
	if (bechStringResult.isOk()) return ok(bechStringResult.value)

	return fromSpecString(string)
}

const fromUnsafe = (
	input: ResourceIdentifierOrUnsafeInput,
): Result<ResourceIdentifierT, Error> => {
	return isResourceIdentifier(input) ? ok(input) : fromString(input)
}

export const ResourceIdentifier = {
	create,
	fromUnsafe,
	fromString,
	fromBech32String,
}

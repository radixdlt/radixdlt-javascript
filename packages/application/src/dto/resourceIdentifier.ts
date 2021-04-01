import { err, ok, Result } from 'neverthrow'
import { Address, AddressT } from '@radixdlt/account'
import {
	DSONObjectEncoding,
	JSONDecoding,
	JSONEncoding,
	serializerNotNeeded,
	taggedStringDecoder,
} from '@radixdlt/data-formats'
import { Byte } from '@radixdlt/util'
import { ResourceIdentifierT } from './_types'

const separator = '/'

const CBOR_BYTESTRING_PREFIX: Byte = 6
const JSON_TAG = ':rri:'

const JSONDecoder = taggedStringDecoder(JSON_TAG)((identifier: string) =>
	fromString(identifier),
)

const jsonDecoding = JSONDecoding.withDecoders(
	JSONDecoder,
).create<ResourceIdentifierT>()

const fromAddressAndName = (input: {
	address: AddressT
	name: string
}): ResourceIdentifierT => {
	const address = input.address
	const name = input.name

	const identifier = ['', address.toString(), name].join(separator)

	return {
		...JSONEncoding(serializerNotNeeded)(() => `${JSON_TAG}${identifier}`),
		...DSONObjectEncoding({
			prefix: CBOR_BYTESTRING_PREFIX,
			buffer: Buffer.from(identifier),
		}),
		address,
		name,
		toString: () => identifier,
		equals: (other) => other.address.equals(address) && other.name === name,
	}
}

const fromString = (
	identifierString: string,
): Result<ResourceIdentifierT, Error> => {
	const components = identifierString.split(separator)
	if (components.length !== 3) return err(new Error('Invalid RRI string'))
	if (components[0].length !== 0) return err(new Error('Expected leading /'))
	const name = components[2]
	if (name.length === 0) return err(new Error('Expected non empty name'))

	return Address.fromBase58String(components[1]).map(
		(address): ResourceIdentifierT => ({
			...JSONEncoding(serializerNotNeeded)(
				() => `${JSON_TAG}${identifierString}`,
			),
			...DSONObjectEncoding({
				prefix: CBOR_BYTESTRING_PREFIX,
				buffer: Buffer.from(identifierString),
			}),
			address,
			name,
			toString: () => identifierString,
			equals: (other) =>
				other.address.equals(address) && other.name === name,
		}),
	)
}

export const isResourceIdentifier = (
	something: ResourceIdentifierT | unknown,
): something is ResourceIdentifierT => {
	const inspection = something as ResourceIdentifierT
	return (
		inspection.address !== undefined &&
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
	return isResourceIdentifier(input) ? ok(input) : fromString(input)
}

export const ResourceIdentifier = {
	JSON_TAG,
	JSONDecoder,
	...jsonDecoding,
	fromAddressAndName,
	fromUnsafe,
	fromString,
}

import { AddressT } from '@radixdlt/crypto'
import { ResourceIdentifierT } from './_types'
import { err, ok, Result } from 'neverthrow'
import { addressFromBase58String } from '@radixdlt/crypto'
import {
	DSONObjectEncoding,
	JSONDecoding,
	JSONEncoding,
	primitiveDecoder,
	serializerNotNeeded,
} from '@radixdlt/data-formats'
import { Byte } from '@radixdlt/util'

const separator = '/'

const CBOR_BYTESTRING_PREFIX: Byte = 6
const JSON_TAG = ':rri:'

const { JSONDecoders, fromJSON } = JSONDecoding<ResourceIdentifierT>()(
	primitiveDecoder(JSON_TAG, (identifier: string) => fromString(identifier)),
)

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

	return addressFromBase58String(components[1]).map(
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

const fromUnsafe = (
	input: ResourceIdentifierT | string,
): Result<ResourceIdentifierT, Error> => {
	return isResourceIdentifier(input) ? ok(input) : fromString(input)
}

export const ResourceIdentifier = {
	JSON_TAG,
	JSONDecoders,
	fromJSON,
	fromAddressAndName,
	fromUnsafe,
	fromString,
}

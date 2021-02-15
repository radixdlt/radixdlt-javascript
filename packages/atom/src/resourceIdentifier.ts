import { Address } from '@radixdlt/account'
import { ResourceIdentifier } from './_types'
import { err, ok, Result } from 'neverthrow'
import { addressFromBase58String } from '@radixdlt/crypto'
import { DSONObjectEncoding } from '@radixdlt/data-formats'
import { Byte } from '@radixdlt/util'

const separator = '/'

const CBOR_BYTESTRING_PREFIX: Byte = 6

export const resourceIdentifierFromAddressAndName = (input: {
	address: Address
	name: string
}): ResourceIdentifier => {
	const address = input.address
	const name = input.name

	const identifier = ['', address.toString(), name].join(separator)

	return {
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

export const resourceIdentifierFromString = (
	identifierString: string,
): Result<ResourceIdentifier, Error> => {
	const components = identifierString.split(separator)
	if (components.length !== 3) return err(new Error('Invalid RRI string'))
	if (components[0].length !== 0) return err(new Error('Expected leading /'))
	const name = components[2]
	if (name.length === 0) return err(new Error('Expected non empty name'))

	return addressFromBase58String(components[1]).map(
		(address): ResourceIdentifier => ({
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
	something: ResourceIdentifier | unknown,
): something is ResourceIdentifier => {
	const inspection = something as ResourceIdentifier
	return (
		inspection.address !== undefined &&
		inspection.name !== undefined &&
		inspection.toString !== undefined &&
		inspection.equals !== undefined
	)
}

export const resourceIdentifierFromUnsafe = (
	input: ResourceIdentifier | string,
): Result<ResourceIdentifier, Error> => {
	return isResourceIdentifier(input)
		? ok(input)
		: resourceIdentifierFromString(input)
}

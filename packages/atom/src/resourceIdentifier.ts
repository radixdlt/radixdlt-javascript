import { AddressLike } from '@radixdlt/crypto'
import { ResourceIdentifier } from './_types'
import { err, ok, Result } from 'neverthrow'
import { Address } from '@radixdlt/crypto'

const separator = '/'

export const resourceIdentifierFromAddressAndName = (input: {
	address: AddressLike
	name: string
}): ResourceIdentifier => {
	const address = input.address
	const name = input.name
	return {
		address,
		name,
		toString: () => ['', address.toString(), name].join(separator),
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
	return Address(components[1]).map(
		(address): ResourceIdentifier => ({
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

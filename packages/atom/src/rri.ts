import { Address } from '@radixdlt/crypto'
import { ResourceIdentifier } from './_types'
import { err, Result } from 'neverthrow'
import { addressFromBase58String } from '@radixdlt/crypto'

const separator = '/'

export const resourceIdentifierFromAddressAndName = (input: {
	address: Address
	name: string
}): ResourceIdentifier => {
	const address = input.address
	const name = input.name
	return {
		address,
		name,
		toString: () => ['', address.toString(), name].join(separator),
	}
}

// eslint-disable-next-line complexity
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
			address,
			name,
			toString: () => identifierString,
		}),
	)
}

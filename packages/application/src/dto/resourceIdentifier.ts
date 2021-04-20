import { err, ok, Result } from 'neverthrow'
import { Address, AddressT } from '@radixdlt/account'
import { ResourceIdentifierT } from './_types'

const separator = '/'

const fromAddressAndName = (input: {
	address: AddressT
	name: string
}): ResourceIdentifierT => {
	const address = input.address
	const name = input.name

	const identifier = ['', address.toString(), name].join(separator)

	return {
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

	const isNativeToken = components[1] === '' ? true : false

	return isNativeToken ? ok({
		address: undefined as any,
		name,
		toString: () => identifierString,
		equals: (other: any) =>
			other.name === name
	}) : Address.fromBase58String(components[1]).map(
		(address): ResourceIdentifierT => ({
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
	fromAddressAndName,
	fromUnsafe,
	fromString,
}

import { Address } from '@radixdlt/crypto'
import { Granularity, Nonce, PositiveAmount } from '@radixdlt/primitives'

/**
 * A Radix resource identifier is a human readable index into the Ledger which points to a name state machine
 *
 * On format: `/:address/:name`, e.g.
 * `"/JH1P8f3znbyrDj8F4RWpix7hRkgxqHjdW2fNnKpR3v6ufXnknor/XRD"`
 */
export type ResourceIdentifier = /* DSONCoable */ Readonly<{
	address: Address
	name: string
	toString: () => string
	equals: (other: ResourceIdentifier) => boolean
}>

export type IsOwnerOfToken = () => boolean

export enum TokenPermission {
	TokenOwnerOnly = 'token_owner_only',
	All = 'all',
	None = 'none',
}

export enum TokenTransition {
	Mint = 'mint',
	Burn = 'burn',
}

export type TokenPermissions = /* DSONCodable */ Readonly<{
	canBeMinted: (isOwnerOfToken: IsOwnerOfToken) => boolean
	canBeBurned: (isOwnerOfToken: IsOwnerOfToken) => boolean
}>

export type TransferrableTokensParticle = /* DSONCoable */ Readonly<{
	// The recipient address of the tokens to be transffered
	address: Address
	// The identifier of which token type is being transferred
	tokenDefinitionReference: ResourceIdentifier
	granularity: Granularity
	nonce: Nonce
	amount: PositiveAmount
	permissions: TokenPermissions
}>

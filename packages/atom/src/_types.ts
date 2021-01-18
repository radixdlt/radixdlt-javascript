import { AddressLike } from '@radixdlt/crypto'
import {
	Amount,
	Granularity,
	Nonce,
	PositiveAmount,
} from '@radixdlt/primitives'

/**
 * A Radix resource identifier is a human readable index into the Ledger which points to a name state machine
 *
 * On format: `/:address/:name`, e.g.
 * `"/JH1P8f3znbyrDj8F4RWpix7hRkgxqHjdW2fNnKpR3v6ufXnknor/XRD"`
 */
export type ResourceIdentifier = /* DSONCoable */ Readonly<{
	address: AddressLike
	name: string
	toString: () => string
	equals: (other: ResourceIdentifier) => boolean
}>

export type IsOwnerOfToken = () => boolean

export enum TokenPermission {
	TOKEN_OWNER_ONLY = 'token_owner_only',
	ALL = 'all',
	NONE = 'none',
}

export enum TokenTransition {
	MINT = 'mint',
	BURN = 'burn',
}

export type Supply = Amount

export type TokenPermissions = /* DSONCodable */ Readonly<{
	canBeMinted: (isOwnerOfToken: IsOwnerOfToken) => boolean
	canBeBurned: (isOwnerOfToken: IsOwnerOfToken) => boolean
}>

export type TransferrableTokensParticle = /* DSONCoable */ Readonly<{
	// The recipient address of the tokens to be transffered
	address: AddressLike
	// The identifier of which token type is being transferred
	tokenDefinitionReference: ResourceIdentifier
	granularity: Granularity
	nonce: Nonce
	amount: PositiveAmount
	permissions: TokenPermissions
}>

export type UnallocatedTokensParticle = /* DSONCoable */ Readonly<{
	tokenDefinitionReference: ResourceIdentifier
	granularity: Granularity
	nonce: Nonce
	amount: Supply
	permissions: TokenPermissions
}>

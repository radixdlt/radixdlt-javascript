import { PublicKey } from '@radixdlt/crypto'

export enum NetworkT {
	MAINNET = 'MAINNET',
	BETANET = 'BETANET',
}
export type ResourceIdentifierT = Readonly<{
	hash: Buffer
	__witness: 'isRRI'
	name: string
	toString: () => string
	equals: (other: ResourceIdentifierT) => boolean
}>

export enum AddressTypeT {
	VALIDATOR = 'VALIDATOR_ADDRESS',
	ACCOUNT = 'ACCOUNT_ADDRESS',
}

export type AbstractAddressT = Readonly<{
	addressType: AddressTypeT
	network: NetworkT
	publicKey: PublicKey
	toString: () => string
	equals: (other: AbstractAddressT) => boolean
}>

export type AddressT = AbstractAddressT &
	Readonly<{
		addressType: AddressTypeT.ACCOUNT
		equals: (other: AddressT) => boolean
	}>

export type ValidatorAddressT = AbstractAddressT &
	Readonly<{
		addressType: AddressTypeT.VALIDATOR
		equals: (other: ValidatorAddressT) => boolean
	}>

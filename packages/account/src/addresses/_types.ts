import { PublicKeyT } from '@radixdlt/crypto'

export enum NetworkT {
	MAINNET = 'MAINNET',
	BETANET = 'BETANET',
}
export type ResourceIdentifierT = Readonly<{
	hash: Buffer
	__witness: 'isRRI'
	network: NetworkT
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
	publicKey: PublicKeyT
	toString: () => string
	equals: (other: AbstractAddressT) => boolean
}>

export type AccountAddressT = AbstractAddressT &
	Readonly<{
		addressType: AddressTypeT.ACCOUNT
		equals: (other: AccountAddressT) => boolean
	}>

export type ValidatorAddressT = AbstractAddressT &
	Readonly<{
		addressType: AddressTypeT.VALIDATOR
		equals: (other: ValidatorAddressT) => boolean
	}>

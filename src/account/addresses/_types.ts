import { PublicKeyT } from '@crypto'
import { Network } from '@primitives'

export type ResourceIdentifierT = Readonly<{
	hash: Buffer
	__witness: 'isRRI'
	network: Network
	name: string
	toPrimitive: () => string
	equals: (other: ResourceIdentifierT) => boolean
}>

export enum AddressTypeT {
	VALIDATOR = 'VALIDATOR_ADDRESS',
	ACCOUNT = 'ACCOUNT_ADDRESS',
}

export type AbstractAddressT = Readonly<{
	addressType: AddressTypeT
	network: Network
	publicKey: PublicKeyT
	toPrimitive: () => string
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

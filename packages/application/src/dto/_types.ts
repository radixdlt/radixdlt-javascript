import { DSONCodable, JSONEncodable } from '@radixdlt/data-formats'
import { AddressT } from '@radixdlt/account'
import {
	ActionType,
	ExecutedAction,
	IntendedAction,
	StakePosition,
	UnstakePosition,
} from '../actions/_types'
import { AmountT } from '@radixdlt/primitives'
import { Signature } from '@radixdlt/crypto'

export type TokenPermissions = JSONEncodable &
	DSONCodable &
	Readonly<{
		permissions: Readonly<{ [key in TokenTransition]: TokenPermission }>
		canBeMinted: (isOwnerOfToken: IsOwnerOfToken) => boolean
		canBeBurned: (isOwnerOfToken: IsOwnerOfToken) => boolean
		mintPermission: TokenPermission
		equals: (other: TokenPermissions) => boolean
	}>

/**
 * A Radix resource identifier is a human readable index into the Ledger which points to a name state machine
 *
 * On format: `/:address/:name`, e.g.
 * `"/JH1P8f3znbyrDj8F4RWpix7hRkgxqHjdW2fNnKpR3v6ufXnknor/XRD"`
 */
export type ResourceIdentifierT = JSONEncodable &
	DSONCodable &
	Readonly<{
		address: AddressT
		name: string
		toString: () => string
		equals: (other: ResourceIdentifierT) => boolean
	}>

/**
 * A transaction identifier, 32 bytes hash of signature + hashOfTxBlob.
 * Used to lookup transactions by ID.
 */
export type TransactionIdentifierT = DSONCodable &
	Readonly<{
		toString: () => string
		equals: (other: TransactionIdentifierT) => boolean
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

export type TransactionIntent = Readonly<{
	actions: IntendedAction[]
	message?: string
}>

export type ValidatorsRequestInput = Readonly<{
	size: number
	// Address of last seen validator in list
	cursor: string
}>

export type TransactionHistoryRequestInput = Readonly<{
	address: AddressT
	size: number
	cursor?: TransactionIdentifierT
}>

export type ExecutedTransaction = Readonly<{
	txID: TransactionIdentifierT
	sentAt: Date
	fee: AmountT
	message?: {
		msg: string
		encryptionScheme: string
	}
	actions: ExecutedAction[]
}>

export type TokenBalance = Readonly<{
	token: ResourceIdentifierT
	amount: AmountT
}>

export type Token = Readonly<{
	name: string
	rri: ResourceIdentifierT
	symbol: string
	description?: string
	granularity: AmountT
	isSupplyMutable: boolean
	currentSupply: AmountT
	tokenInfoURL: URL
	iconURL: URL
	tokenPermission: TokenPermissions
}>

export type TransactionBlob = Readonly<{
	// Bytes on hex format
	blob: string
}>

export type UnsignedTransaction = Readonly<{
	trasaction: TransactionBlob &
		Readonly<{
			// hex string
			hashOfBlobToSign: string
		}>
	fee: AmountT
}>

export type SignedTransaction = Readonly<{
	transaction: TransactionBlob
	signature: Signature
}>

export type PendingTransaction = Readonly<{
	txID: TransactionIdentifierT
	errorMessage?: string
}>

export type RawToken = Readonly<{
	name: string
	rri: string
	symbol: string
	description?: string
	granularity: string
	isSupplyMutable: boolean
	currentSupply: string
	tokenInfoURL: string
	iconURL: string
	tokenPermission: {
		burn: TokenPermission
		mint: TokenPermission
	}
}>

export type RawExecutedActionBase = Readonly<{
	type: ActionType
}>

export type RawOtherExecutedAction = RawExecutedActionBase

export type RawTransferAction = RawExecutedActionBase &
	Readonly<{
		from: string
		to: string
		amount: string
		resourceIdentifier: string
	}>

export type RawStakesAction = RawExecutedActionBase &
	Readonly<{
		validator: string
		amount: string
	}>

export type RawUnstakesAction = RawExecutedActionBase &
	Readonly<{
		validator: string
		amount: string
	}>

export type NetworkTransactionThroughput = Readonly<{
	tps: number
}>
export type NetworkTransactionDemand = Readonly<{
	tps: number
}>

export enum TransactionStatus {
	PENDING = 'PENDING',
	CONFIRMED = 'CONFIRMED',
	FAILED = 'FAILED',
}

export type StatusOfTransaction = Readonly<{
	txID: TransactionIdentifierT
	status: TransactionStatus
	failure?: string
}>

export type RawExecutedAction =
	| RawTransferAction
	| RawStakesAction
	| RawUnstakesAction
	| RawOtherExecutedAction

export type TokenBalances = Readonly<{
	owner: AddressT
	tokenBalances: TokenBalance[]
}>

export type TransactionHistory = Readonly<{
	cursor: string
	transactions: ExecutedTransaction[]
}>

export type Validator = Readonly<{
	address: AddressT
	ownerAddress: AddressT
	name: string
	infoURL: URL
	totalDelegatedStake: AmountT
	ownerDelegation: AmountT
	isExternalStakeAccepted: boolean
}>

export type Validators = Validator[]

export type RawExecutedTransaction = Readonly<{
	txID: string
	sentAt: string
	fee: string
	message?: {
		msg: string
		encryptionScheme: string
	}
	actions: RawExecutedAction[]
}>

export type StakePositions = StakePosition[]

export type UnstakePositions = UnstakePosition[]

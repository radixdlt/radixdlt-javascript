import { DSONCodable, JSONEncodable } from '@radixdlt/data-formats'
import { AccountT, AddressT } from '@radixdlt/account'
import {
	ActionInput,
	ActionType,
	ExecutedAction,
	IntendedAction,
	StakeTokensInput,
	TransferTokensInput,
	UnstakeTokensInput,
} from '../actions/_types'
import { AmountT } from '@radixdlt/primitives'
import { Signature } from '@radixdlt/crypto'
import { Observable } from 'rxjs'
import { Result } from 'neverthrow'
import { EncryptedMessage } from '@radixdlt/account'

export type StakePosition = Readonly<{
	validator: AddressT
	amount: AmountT
}>

export type UnstakePosition = Readonly<{
	validator: AddressT
	amount: AmountT
	withdrawalTxID: TransactionIdentifierT
	epochsUntil: number
}>

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
		__hex: string
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

export type TransactionIntentBuilderState = Readonly<{
	actionInputs: ActionInput[]
	message?: string
}>

export type TransactionIntentBuilderT = Readonly<{
	__state: TransactionIntentBuilderState

	transferTokens: (input: TransferTokensInput) => TransactionIntentBuilderT
	stakeTokens: (input: StakeTokensInput) => TransactionIntentBuilderT
	unstakeTokens: (input: UnstakeTokensInput) => TransactionIntentBuilderT
	message: (msg: string) => TransactionIntentBuilderT

	// Build
	__syncBuildIgnoreMessage: (
		from: AddressT,
	) => Result<TransactionIntent, Error>
	build: (
		input: Readonly<{
			spendingSender: Observable<AddressT>
			encryptMessageIfAnyWithAccount: Observable<AccountT>
		}>,
	) => Observable<TransactionIntent>
}>

export type TransactionIntent = Readonly<{
	actions: IntendedAction[]
	message?: EncryptedMessage
}>

export type ValidatorsRequestInput = Readonly<{
	size: number
	// Address of last seen validator in list
	cursor: string
}>

export type TransactionHistoryOfKnownAddressRequestInput = Readonly<{
	size: number
	cursor?: string
}>

export type TransactionHistoryActiveAccountRequestInput = TransactionHistoryOfKnownAddressRequestInput

export type TransactionHistoryRequestInput = TransactionHistoryOfKnownAddressRequestInput &
	Readonly<{
		address: AddressT
	}>

export type ExecutedTransaction = Readonly<{
	txID: TransactionIdentifierT
	sentAt: Date
	fee: AmountT
	message?: EncryptedMessage
	actions: ExecutedAction[]
}>

export type TokenAmount = Readonly<{
	token: ResourceIdentifierT
	amount: AmountT
}>

export type TokenBalance = TokenAmount

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
		rri: string
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

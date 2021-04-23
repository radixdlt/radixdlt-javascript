import { getAPI } from './json-rpc/interface'

import { Observable } from 'rxjs'
import {
	AddressT,
	ResourceIdentifierT,
	ValidatorAddressT,
} from '@radixdlt/account'

import {
	ExecutedTransaction,
	NetworkTransactionDemand,
	NetworkTransactionThroughput,
	PendingTransaction,
	SignedTransaction,
	StakePositions,
	StatusOfTransaction,
	Token,
	TransactionHistory,
	TransactionHistoryRequestInput,
	TransactionIdentifierT,
	TransactionIntent,
	BuiltTransaction,
	UnstakePositions,
	Validators,
	ValidatorsRequestInput,
	SimpleTokenBalances,
	FinalizedTransaction,
	Validator,
} from '../dto/_types'

type JsonRpcAPI = {
	[Property in keyof ReturnType<typeof getAPI>]: ReturnType<
		typeof getAPI
	>[Property]
}

export type NodeAPI = JsonRpcAPI // && RestAPI

export type NodeT = Readonly<{
	url: URL
}>

export type RadixAPI = Readonly<{
	tokenBalancesForAddress: (
		address: AddressT,
	) => Observable<SimpleTokenBalances>

	transactionHistory: (
		input: TransactionHistoryRequestInput,
	) => Observable<TransactionHistory>

	nativeToken: () => Observable<Token>

	tokenInfo: (rri: ResourceIdentifierT) => Observable<Token>

	stakesForAddress: (address: AddressT) => Observable<StakePositions>
	unstakesForAddress: (address: AddressT) => Observable<UnstakePositions>

	transactionStatus: (
		txID: TransactionIdentifierT,
	) => Observable<StatusOfTransaction>

	lookupTransaction: (
		txID: TransactionIdentifierT,
	) => Observable<ExecutedTransaction>

	validators: (input: ValidatorsRequestInput) => Observable<Validators>

	lookupValidator: (input: ValidatorAddressT) => Observable<Validator>

	networkTransactionThroughput: () => Observable<NetworkTransactionThroughput>

	networkTransactionDemand: () => Observable<NetworkTransactionDemand>

	buildTransaction: (
		transactionIntent: TransactionIntent,
	) => Observable<BuiltTransaction>

	submitSignedTransaction: (
		signedTransaction: FinalizedTransaction & SignedTransaction,
	) => Observable<PendingTransaction>

	finalizeTransaction: (
		signedUnconfirmedTransaction: SignedTransaction,
	) => Observable<FinalizedTransaction>

	networkId: () => Observable<NetworkT>
}>

export type RadixCoreAPI = RadixAPI &
	Readonly<{
		node: NodeT
	}>

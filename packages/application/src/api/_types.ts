import { getAPI } from './json-rpc/interface'

import { Magic } from '@radixdlt/primitives'
import { Observable } from 'rxjs'
import { AddressT } from '@radixdlt/account'

import {
	ExecutedTransaction,
	NetworkTransactionDemand,
	NetworkTransactionThroughput,
	PendingTransaction,
	ResourceIdentifierT,
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

	networkTransactionThroughput: () => Observable<NetworkTransactionThroughput>

	networkTransactionDemand: () => Observable<NetworkTransactionDemand>

	buildTransaction: (
		transactionIntent: TransactionIntent,
	) => Observable<BuiltTransaction>

	submitSignedTransaction: (
		signedTransaction: FinalizedTransaction,
	) => Observable<SubmittedTransaction>

	finalizeTransaction: (
		signedUnconfirmedTransaction: FinalizedTransaction,
	) => Observable<FinalizedTransaction>

	networkId: () => Observable<Magic>
}>

export type RadixCoreAPI = RadixAPI &
	Readonly<{
		node: NodeT
	}>

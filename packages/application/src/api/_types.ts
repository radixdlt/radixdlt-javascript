import { getAPI } from './json-rpc'

import { Observable } from 'rxjs'
import {
	AccountAddressT,
	ResourceIdentifierT,
	ValidatorAddressT,
	NetworkT,
} from '@radixdlt/account'

import {
	SimpleExecutedTransaction,
	NetworkTransactionDemand,
	NetworkTransactionThroughput,
	PendingTransaction,
	SignedTransaction,
	StakePositions,
	StatusOfTransaction,
	Token,
	SimpleTransactionHistory,
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
} from '../dto'

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
		address: AccountAddressT,
	) => Observable<SimpleTokenBalances>

	transactionHistory: (
		input: TransactionHistoryRequestInput,
	) => Observable<SimpleTransactionHistory>

	nativeToken: () => Observable<Token>

	tokenInfo: (rri: ResourceIdentifierT) => Observable<Token>

	stakesForAddress: (address: AccountAddressT) => Observable<StakePositions>
	unstakesForAddress: (
		address: AccountAddressT,
	) => Observable<UnstakePositions>

	transactionStatus: (
		txID: TransactionIdentifierT,
	) => Observable<StatusOfTransaction>

	lookupTransaction: (
		txID: TransactionIdentifierT,
	) => Observable<SimpleExecutedTransaction>

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

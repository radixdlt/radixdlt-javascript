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
	TokenBalances,
	TransactionHistory,
	TransactionIdentifierT,
	TransactionIntent,
	UnsignedTransaction,
	UnstakePositions,
	Validators,
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
	tokenBalancesForAddress: (address: AddressT) => Observable<TokenBalances>

	transactionHistory: (
		input: Readonly<{
			address: AddressT
			size: number
			cursor?: TransactionIdentifierT
		}>,
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

	validators: (
		input: Readonly<{ size: number; offset: number }>,
	) => Observable<Validators>

	networkTransactionThroughput: () => Observable<NetworkTransactionThroughput>

	networkTransactionDemand: () => Observable<NetworkTransactionDemand>

	buildTransaction: (
		transactionIntent: TransactionIntent,
	) => Observable<UnsignedTransaction>

	submitSignedTransaction: (
		signedTransaction: SignedTransaction,
	) => Observable<PendingTransaction>
}>

export type RadixCoreAPI = RadixAPI &
	Readonly<{
		node: NodeT
		magic: () => Observable<Magic>
	}>

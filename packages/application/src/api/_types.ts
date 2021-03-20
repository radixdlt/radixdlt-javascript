import { getAPI } from './json-rpc/interface'
import { AtomIdentifierT } from '@radixdlt/atom'

import { Magic } from '@radixdlt/primitives'
import { Observable } from 'rxjs'
import { AddressT } from '@radixdlt/account'
import {
	ExecutedTransactions as ExecutedTransactionsEndpoint,
	GetAtomForTransaction as GetAtomForTransactionEndpoint,
	NativeToken as NativeTokenEndpoint,
	NetworkTransactionDemand as NetworkTransactionDemandEndpoint,
	NetworkTransactionThroughput as NetworkTransactionThroughputEndpoint,
	Stakes as StakesEndpoint,
	SubmitSignedAtom as SubmitSignedAtomEndpoint,
	TokenBalances as TokenBalancesEndpoint,
	TokenFeeForTransaction as TokenFeeForTransactionEndpoint,
	TransactionStatus as TransactionStatusEndpoint,
	Transaction as TransactionType,
} from './json-rpc/_types'
import { PublicKey, Signature } from '@radixdlt/crypto'

type JsonRpcAPI = {
	[Property in keyof ReturnType<typeof getAPI>]: ReturnType<
		typeof getAPI
	>[Property]
}

export type NodeAPI = JsonRpcAPI // && RestAPI

export type Transaction = TransactionType

export type NodeT = Readonly<{
	url: URL
}>

export type TokenBalances = TokenBalancesEndpoint.DecodedResponse
export type ExecutedTransactions = ExecutedTransactionsEndpoint.DecodedResponse
export type Token = NativeTokenEndpoint.DecodedResponse
export type TokenFeeForTransaction = TokenFeeForTransactionEndpoint.DecodedResponse
export type Stakes = StakesEndpoint.DecodedResponse
export type TransactionStatus = TransactionStatusEndpoint.DecodedResponse
export type NetworkTransactionThroughput = NetworkTransactionThroughputEndpoint.DecodedResponse
export type NetworkTransactionDemand = NetworkTransactionDemandEndpoint.DecodedResponse
export type AtomFromTransactionResponse = GetAtomForTransactionEndpoint.DecodedResponse
export type SubmittedAtomResponse = SubmitSignedAtomEndpoint.DecodedResponse

export type SignedAtom = Readonly<{
	atomCBOR: string
	signerPublicKey: PublicKey
	signature: Signature
}>

export type RadixAPI = Readonly<{
	tokenBalancesForAddress: (address: AddressT) => Observable<TokenBalances>

	executedTransactions: (
		input: Readonly<{
			address: AddressT
			size: number
			cursor?: AtomIdentifierT
		}>,
	) => Observable<ExecutedTransactions>

	nativeToken: () => Observable<Token>

	tokenFeeForTransaction: (
		transaction: Transaction,
	) => Observable<TokenFeeForTransaction>

	stakesForAddress: (address: AddressT) => Observable<Stakes>

	transactionStatus: (
		atomIdentifier: AtomIdentifierT,
	) => Observable<TransactionStatus>

	networkTransactionThroughput: () => Observable<NetworkTransactionThroughput>

	networkTransactionDemand: () => Observable<NetworkTransactionDemand>

	getAtomForTransaction: (
		transaction: Transaction,
	) => Observable<AtomFromTransactionResponse>

	submitSignedAtom: (
		signedAtom: SignedAtom,
	) => Observable<SubmittedAtomResponse>
}>

export type RadixCoreAPI = RadixAPI &
	Readonly<{
		node: NodeT
		magic: () => Observable<Magic>
	}>

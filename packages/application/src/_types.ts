import { AnyUpParticle, AtomIdentifierT } from '@radixdlt/atom'
import { Result } from 'neverthrow'

import { AmountT, Magic } from '@radixdlt/primitives'
import { Observable } from 'rxjs'
import { AccountsT, AccountT, AddressT, WalletT } from '@radixdlt/account'

export type FeeEntry = Readonly<{
	feeFor: (
		input: Readonly<{
			upParticles: AnyUpParticle[]
			atomByteCount: number
		}>,
	) => Result<AmountT, Error>
}>

export type TokenFeeTable = Readonly<{
	minimumFee: AmountT
	feeEntries: FeeEntry[]
}>

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
} from './api/json-rpc/_types'

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
export type SignedAtom = SubmitSignedAtomEndpoint.Input

export type RadixAPI = Readonly<{
	tokenBalancesForAddress: (address: AddressT) => Observable<TokenBalances>

	executedTransactions: (
		input: Readonly<{
			address: AddressT
			// pagination
			size: number
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

export type RadixT = RadixAPI &
	Readonly<{
		// Input

		// Primiarily useful for testing.
		_withAPI: (radixCoreAPI$: Observable<RadixCoreAPI>) => void

		withAPIAtNode: (node$: Observable<NodeT>) => void
		withWallet: (wallet: WalletT) => void

		// Observe Input
		observeWallet: () => Observable<WalletT>
		observeNode: () => Observable<NodeT>

		// Wallet APIs
		observeActiveAddress: () => Observable<AddressT>
		observeActiveAccount: () => Observable<AccountT>
		observeAccounts: () => Observable<AccountsT>

		// Active Address/Account APIs
		tokenBalancesOfActiveAccount: () => Observable<TokenBalances>
	}>

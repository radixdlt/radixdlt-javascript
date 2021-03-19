import { AtomIdentifierT } from '@radixdlt/atom'

import { Magic } from '@radixdlt/primitives'
import { Observable } from 'rxjs'
import {
	AccountsT,
	AccountT,
	AddressT,
	DeriveNextAccountInput,
	SwitchAccountInput,
	WalletT,
} from '@radixdlt/account'

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
import { KeystoreT, PublicKey, Signature } from '@radixdlt/crypto'

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

type NodeError = {
	tag: 'node'
	error: Error
}

type WalletError = {
	tag: 'wallet'
	error: Error
}

type APIError = {
	tag: 'api'
	error: Error
}

export type ErrorNotification = NodeError | WalletError | APIError

export type RadixAPI = Readonly<{
	tokenBalancesForAddress: (address: AddressT) => Observable<TokenBalances>

	executedTransactions: (
		input: Readonly<{
			address: AddressT

			// pagination
			size: number // must be larger than 0
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

export type RadixT = Readonly<{
	api: RadixAPI
	// Input
	connect: (url: URL) => RadixT

	// Primiarily useful for testing.
	__withAPI: (radixCoreAPI$: Observable<RadixCoreAPI>) => RadixT

	withNodeConnection: (node$: Observable<NodeT>) => RadixT
	withWallet: (wallet: WalletT) => RadixT
	login: (password: string, loadKeystore: () => Promise<KeystoreT>) => RadixT

	// Observe Input
	wallet: Observable<WalletT>
	node: Observable<NodeT>

	// Wallet APIs
	deriveNextAccount: (input?: DeriveNextAccountInput) => RadixT
	switchAccount: (input: SwitchAccountInput) => RadixT

	activeAddress: Observable<AddressT>
	activeAccount: Observable<AccountT>
	accounts: Observable<AccountsT>

	// Active Address/Account APIs
	tokenBalances: Observable<TokenBalances>

	errors: Observable<ErrorNotification>
}>

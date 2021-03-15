import { AnyUpParticle } from '@radixdlt/atom'
import { Result, ResultAsync } from 'neverthrow'
import {
	ExecutedTransactions,
	GetAtomForTransaction,
	NativeToken,
	NetworkTransactionDemand,
	NetworkTransactionThroughput,
	Stakes,
	SubmitSignedAtom,
	TokenBalances,
	TokenFeeForTransaction,
	TransactionStatus,
	UniverseMagic,
} from './api/json-rpc/_types'
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

export type NodeAPI = {
	universeMagic: (
		...input: UniverseMagic.Input
	) => ResultAsync<UniverseMagic.DecodedResponse, Error[]>

	tokenBalances: (
		...input: TokenBalances.Input
	) => ResultAsync<TokenBalances.DecodedResponse, Error[]>

	executedTransactions: (
		...input: ExecutedTransactions.Input
	) => ResultAsync<ExecutedTransactions.DecodedResponse, Error[]>

	nativeToken: (
		...input: NativeToken.Input
	) => ResultAsync<NativeToken.DecodedResponse, Error[]>

	tokenFeeForTransaction: (
		...input: TokenFeeForTransaction.Input
	) => ResultAsync<TokenFeeForTransaction.DecodedResponse, Error[]>

	stakes: (
		...input: Stakes.Input
	) => ResultAsync<Stakes.DecodedResponse, Error[]>

	transactionStatus: (
		...input: TransactionStatus.Input
	) => ResultAsync<TransactionStatus.DecodedResponse, Error[]>

	networkTransactionThroughput: (
		...input: NetworkTransactionThroughput.Input
	) => ResultAsync<NetworkTransactionThroughput.DecodedResponse, Error[]>

	networkTransactionDemand: (
		...input: NetworkTransactionDemand.Input
	) => ResultAsync<NetworkTransactionDemand.DecodedResponse, Error[]>

	getAtomForTransaction: (
		...input: GetAtomForTransaction.Input
	) => ResultAsync<GetAtomForTransaction.DecodedResponse, Error[]>

	submitSignedAtom: (
		...input: SubmitSignedAtom.Input
	) => ResultAsync<SubmitSignedAtom.DecodedResponse, Error[]>
}
export type NodeT = Readonly<{
	url: URL
}>

export type Token = 'TokenDefinition'
export type TokenBalances = 'TokenBalancesForOneAccount'

export type RadixCoreAPI = {
	node: NodeT
	magic: () => Observable<Magic>
	nativeToken: () => Observable<Token>
	tokenBalances: (address: AddressT) => Observable<TokenBalances>
}

export type RadixT = Readonly<{
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

	// API
	nativeToken: () => Observable<Token>
	tokenBalancesOfActiveAccount: () => Observable<TokenBalances>
	// TODO impl all...
}>

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
	UniverseMagic as UniverseMagicEndpoint,
} from './json-rpc/_types'
import { ResultAsync } from 'neverthrow'

export type NodeAPI = Readonly<{
	universeMagic: (
		...input: UniverseMagicEndpoint.Input
	) => ResultAsync<UniverseMagicEndpoint.DecodedResponse, Error[]>

	tokenBalances: (
		...input: TokenBalancesEndpoint.Input
	) => ResultAsync<TokenBalancesEndpoint.DecodedResponse, Error[]>

	executedTransactions: (
		...input: ExecutedTransactionsEndpoint.Input
	) => ResultAsync<ExecutedTransactionsEndpoint.DecodedResponse, Error[]>

	nativeToken: (
		...input: NativeTokenEndpoint.Input
	) => ResultAsync<NativeTokenEndpoint.DecodedResponse, Error[]>

	tokenFeeForTransaction: (
		...input: TokenFeeForTransactionEndpoint.Input
	) => ResultAsync<TokenFeeForTransactionEndpoint.DecodedResponse, Error[]>

	stakes: (
		...input: StakesEndpoint.Input
	) => ResultAsync<StakesEndpoint.DecodedResponse, Error[]>

	transactionStatus: (
		...input: TransactionStatusEndpoint.Input
	) => ResultAsync<TransactionStatusEndpoint.DecodedResponse, Error[]>

	networkTransactionThroughput: (
		...input: NetworkTransactionThroughputEndpoint.Input
	) => ResultAsync<
		NetworkTransactionThroughputEndpoint.DecodedResponse,
		Error[]
	>

	networkTransactionDemand: (
		...input: NetworkTransactionDemandEndpoint.Input
	) => ResultAsync<NetworkTransactionDemandEndpoint.DecodedResponse, Error[]>

	getAtomForTransaction: (
		...input: GetAtomForTransactionEndpoint.Input
	) => ResultAsync<GetAtomForTransactionEndpoint.DecodedResponse, Error[]>

	submitSignedAtom: (
		...input: SubmitSignedAtomEndpoint.Input
	) => ResultAsync<SubmitSignedAtomEndpoint.DecodedResponse, Error[]>
}>

import { AnyUpParticle } from '@radixdlt/atom'
import { AmountT } from '@radixdlt/primitives'
import { Result } from 'neverthrow'
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
	) => Promise<Result<UniverseMagic.DecodedResponse, Error[]>>
	tokenBalances: (
		...input: TokenBalances.Input
	) => Promise<Result<TokenBalances.DecodedResponse, Error[]>>
	executedTransactions: (
		...input: ExecutedTransactions.Input
	) => Promise<Result<ExecutedTransactions.DecodedResponse, Error[]>>
	nativeToken: (
		...input: NativeToken.Input
	) => Promise<Result<NativeToken.DecodedResponse, Error[]>>
	tokenFeeForTransaction: (
		...input: TokenFeeForTransaction.Input
	) => Promise<Result<TokenFeeForTransaction.DecodedResponse, Error[]>>
	stakes: (
		...input: Stakes.Input
	) => Promise<Result<Stakes.DecodedResponse, Error[]>>
	transactionStatus: (
		...input: TransactionStatus.Input
	) => Promise<Result<TransactionStatus.DecodedResponse, Error[]>>
	networkTransactionThroughput: (
		...input: NetworkTransactionThroughput.Input
	) => Promise<Result<NetworkTransactionThroughput.DecodedResponse, Error[]>>
	networkTransactionDemand: (
		...input: NetworkTransactionDemand.Input
	) => Promise<Result<NetworkTransactionDemand.DecodedResponse, Error[]>>
	getAtomForTransaction: (
		...input: GetAtomForTransaction.Input
	) => Promise<Result<GetAtomForTransaction.DecodedResponse, Error[]>>
	submitSignedAtom: (
		...input: SubmitSignedAtom.Input
	) => Promise<Result<SubmitSignedAtom.DecodedResponse, Error[]>>
}

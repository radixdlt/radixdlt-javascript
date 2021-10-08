import { NodeAPI } from './_types'
import { Observable } from 'rxjs'
import {
	AccountAddressT,
	ResourceIdentifierT,
	ValidatorAddressT,
} from '@radixdlt/account'
import {
	SimpleExecutedTransaction,
	NetworkTransactionDemand,
	NetworkTransactionThroughput,
	PendingTransaction,
	FinalizedTransaction,
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
	SimpleTokenBalances,
	Validator,
} from '../dto'
import { ActionType } from '../actions'
import { Network } from '@radixdlt/primitives'
import { pipe } from 'ramda'

const convertToPrimitives = <T extends Record<string, any>>() => (object: T): any => {
	console.log('input:', object)
	let newObject: Record<string, any> = {}

	for (let key in object) newObject[key] = object[key].toPrimitive ? object[key].toPrimitive() : object[key]

	console.log('output:', newObject)
	return newObject
}

export const radixAPI = (api: NodeAPI) => ({
	validators: pipe(
		convertToPrimitives<{ size: number, cursor?: string }>(),
		api['validators.get_next_epoch_set']
	),

	lookupValidator: pipe(
		convertToPrimitives<{ validatorAddress: ValidatorAddressT }>(),
		api['validators.lookup_validator']
	),
	
	/*
	lookupTransaction: (
		txID: TransactionIdentifierT,
	): Observable<SimpleExecutedTransaction> =>
		toObs(a => a['transactions.lookup_transaction'], {
			txID: txID.toString(),
		}),
	*/

	networkId: () => api['network.get_id']({})
		/*
	tokenBalancesForAddress: (
		address: AccountAddressT,
	): Observable<SimpleTokenBalances> =>
		toObs(a => a['account.get_balances'], {
			address: address.toString(),
		}),

	transactionHistory: (
		input: TransactionHistoryRequestInput,
	): Observable<SimpleTransactionHistory> =>
		toObs(a => a['account.get_transaction_history'], {
			address: input.address.toString(),
			size: input.size,
			cursor: input.cursor?.toString(),
		}),

	nativeToken: (): Observable<Token> =>
		toObs(a => a['tokens.get_native_token'], {}),
	tokenInfo: (rri: ResourceIdentifierT): Observable<Token> =>
		toObs(a => a['tokens.get_info'], {
			rri: rri.toString(),
		}),

	stakesForAddress: (
		address: AccountAddressT,
	): Observable<StakePositions> =>
		toObs(a => a['account.get_stake_positions'], {
			address: address.toString(),
		}),

	unstakesForAddress: (
		address: AccountAddressT,
	): Observable<UnstakePositions> =>
		toObs(a => a['account.get_unstake_positions'], {
			address: address.toString(),
		}),

	transactionStatus: (
		txID: TransactionIdentifierT,
	): Observable<StatusOfTransaction> =>
		toObs(a => a['transactions.get_transaction_status'], {
			txID: txID.toString(),
		}),

	NetworkTransactionThroughput: (): Observable<NetworkTransactionThroughput> =>
		toObs(a => a['network.get_throughput'], {}),

	NetworkTransactionDemand: (): Observable<NetworkTransactionDemand> =>
		toObs(a => a['network.get_demand'], {}),

	buildTransaction: (
		transactionIntent: TransactionIntent,
		from: AccountAddressT,
	): Observable<BuiltTransaction> =>
		toObs(a => a['construction.build_transaction'], {
			actions: transactionIntent.actions.map(action =>
				action.type === ActionType.TOKEN_TRANSFER
					? {
						type: action.type,
						from: action.from.toString(),
						to: action.to.toString(),
						amount: action.amount.toString(),
						rri: action.rri.toString(),
					}
					: {
						type: action.type,
						from: action.from.toString(),
						validator: action.validator.toString(),
						amount: action.amount.toString(),
					},
			),
			feePayer: from.toString(),
			disableResourceAllocationAndDestroy: true,
			message: transactionIntent.message
				? transactionIntent.message.toString('hex')
				: undefined,
		}),

	finalizeTransaction: (
		signedTransaction: SignedTransaction,
	): Observable<FinalizedTransaction> =>
		toObs(a => a['construction.finalize_transaction'], {
			blob: signedTransaction.transaction.blob,
			signatureDER: signedTransaction.signature.toDER(),
			publicKeyOfSigner: signedTransaction.publicKeyOfSigner.toString(
				true,
			),
		}),

	submitSignedTransaction: (
		finalizedTx: FinalizedTransaction,
	): Observable<PendingTransaction> =>
		toObs(a => a['construction.submit_transaction'], {
			blob: finalizedTx.blob,
			txID: finalizedTx.txID.toString(),
		}),

		*/
})
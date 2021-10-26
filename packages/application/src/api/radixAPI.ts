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
import { Action } from '../dto/build-transaction'

const convertToPrimitives = <T extends Record<string, any>>() => (object: T): any => { // TODO Fix return type
	let newObject: Record<string, any> = {}

	for (let key in object) newObject[key] = object[key] && object[key].toPrimitive ? object[key].toPrimitive() : object[key]

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
	
	
	lookupTransaction: pipe(
		convertToPrimitives<{ txID: TransactionIdentifierT }>(),
		api['transactions.lookup_transaction']
	),

	networkId: () => api['network.get_id']({}),
		
	tokenBalancesForAddress: pipe(
		convertToPrimitives<{ address: AccountAddressT }>(),
		api['account.get_balances']
	),
/*
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
*/
	transactionStatus: pipe(
		convertToPrimitives<{ txID: TransactionIdentifierT }>(),
		api['transactions.get_transaction_status']
	),
/*
	NetworkTransactionThroughput: (): Observable<NetworkTransactionThroughput> =>
		toObs(a => a['network.get_throughput'], {}),

	NetworkTransactionDemand: (): Observable<NetworkTransactionDemand> =>
		toObs(a => a['network.get_demand'], {}),
*/
	buildTransaction: pipe(
		convertToPrimitives<{ from: AccountAddressT } & TransactionIntent>(),
		args => ({
			...args,
			actions: args.actions.map((action: any) => ({
				from: action.from.toPrimitive(),
				to: action.to.toPrimitive(),
				amount: action.amount,
				rri: action.rri.toPrimitive(),
				type: action.type
			})),
			feePayer: args.from,
			disableResourceAllocationAndDestroy: true
		}),
		api['construction.build_transaction']
	),

	finalizeTransaction: pipe(
		(signedTransaction: SignedTransaction) => ({
			blob: signedTransaction.transaction.blob,
			signatureDER: signedTransaction.signature.toDER(),
			publicKeyOfSigner: signedTransaction.publicKeyOfSigner.toString(true)
		}),
		api['construction.finalize_transaction']
	),

	submitSignedTransaction: pipe(
		(finalizedTx: FinalizedTransaction) => ({
			blob: finalizedTx.blob,
			txID: finalizedTx.txID.toPrimitive(),
		}),
		api['construction.submit_transaction']
	)
})
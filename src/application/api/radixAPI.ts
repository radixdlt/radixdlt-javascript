import { NodeAPI } from './_types'
import {
	AccountAddressT,
	ResourceIdentifierT,
	ValidatorAddressT,
} from '@account'
import {
	FinalizedTransaction,
	PrimitiveFrom,
	SignedTransaction,
	TransactionIdentifierT,
	TransactionIntent,
} from '../dto'
import { pipe } from 'ramda'
import { ActionType } from '../actions'

const convertToPrimitives = <T extends Record<string, any>>() => (object: T): PrimitiveFrom<T> => {
	let newObject: Record<string, any> = {}

	for (let key in object) newObject[key] = object[key] && object[key].toPrimitive ? object[key].toPrimitive() : object[key]

	return newObject as PrimitiveFrom<T>
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

	transactionHistory: pipe(
		convertToPrimitives<{ address: AccountAddressT, size: number, cursor?: string }>(),
		api['account.get_transaction_history']
	),
	
	nativeToken: () => api['tokens.get_native_token']({}),
	
	tokenInfo: pipe(
		convertToPrimitives<{ rri: ResourceIdentifierT }>(),
		api['tokens.get_info']
	),
	
	stakesForAddress: pipe(
		convertToPrimitives<{ address: AccountAddressT }>(),
		api['account.get_stake_positions']
	),
	
	unstakesForAddress: pipe(
		convertToPrimitives<{ address: AccountAddressT }>(),
		api['account.get_unstake_positions']
	),

	transactionStatus: pipe(
		convertToPrimitives<{ txID: TransactionIdentifierT }>(),
		api['transactions.get_transaction_status']
	),

	NetworkTransactionThroughput: () => api['network.get_throughput']({}),

	NetworkTransactionDemand: () => api['network.get_demand']({}),

	buildTransaction: pipe(
		convertToPrimitives<{ from: AccountAddressT } & TransactionIntent>(),
		args => ({
			...args,
			actions: args.actions.map(action => 
					action.type === ActionType.TRANSFER
					? {
						from: action.from.toPrimitive(),
						to: action.to.toPrimitive(),
						amount: action.amount.toString(),
						rri: action.rri.toPrimitive(),
						type: action.type
					}
					: {
						from: action.from.toPrimitive(),
						validator: action.validator.toPrimitive(),
						amount: action.amount.toString(),
						type: action.type
					}
			),
			message: args.message ? args.message.toString() : undefined,
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
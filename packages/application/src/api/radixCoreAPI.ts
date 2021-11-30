import { NodeAPI, NodeT } from './_types'
import { ResultAsync } from 'neverthrow'
import { defer, Observable } from 'rxjs'
import {
	AccountAddressT,
	ResourceIdentifierT,
	ValidatorAddressT,
} from '../../../account'
import { map } from 'rxjs/operators'
import {
	FinalizedTransaction,
	SignedTransaction,
	TransactionHistoryRequestInput,
	TransactionIntent,
	TransactionIdentifierT,
} from '../dto'
import { ActionType } from '../actions'
import { toObservable } from '../../../util'
import { Network } from '../../../primitives'
import {
	AccountBalancesEndpoint,
	AccountTransactionsEndpoint,
	BuildTransactionEndpoint,
	NativeTokenInfoEndpoint,
	StakePositionsEndpoint,
	SubmitTransactionEndpoint,
	TokenInfoEndpoint,
	UnstakePositionsEndpoint,
	ValidatorEndpoint,
	ValidatorsEndpoint,
	FinalizeTransactionEndpoint,
	TransactionEndpoint,
} from './open-api/_types'
import { nodeAPI } from '.'
import { TransactionBuildRequest } from '../../../networking'

export const radixCoreAPI = (node: NodeT, api: NodeAPI) => {
	const toObs = <I, E, O>(
		pickFn: (api: NodeAPI) => (input: I) => ResultAsync<O, E | E[]>,
		input: I,
	): Observable<O> =>
		// @ts-ignore
		defer(() => {
			const fn = pickFn(api)
			// @ts-ignore
			return toObservable(fn(input))
		})

	const toObsMap = <I extends Record<string, unknown>, E, O, P>(
		pickFn: (api: NodeAPI) => (input: I) => ResultAsync<O, E | E[]>,
		mapOutput: (output: O) => P,
		input: I,
	): Observable<P> => toObs(pickFn, input).pipe(map(o => mapOutput(o)))

	return {
		node,

		validators: (
			input: ValidatorsEndpoint.Input,
		): Observable<ValidatorsEndpoint.DecodedResponse> =>
			toObs(a => a['validators'], {
				network: input.network,
			}),

		lookupValidator: (
			input: ValidatorAddressT,
		): Observable<ValidatorEndpoint.DecodedResponse> =>
			toObs(a => a['validator'], {
				network: input.network,
				validator_identifier: {
					address: input.toString(),
				},
			}),

		networkId: () =>
			toObsMap(
				a => a['network'],
				m => m.network,
				{
					body: {},
				},
			),

		tokenBalancesForAddress: (address: AccountAddressT) =>
			toObs(a => a['accountBalances'], {
				network: address.network,
				account_identifier: {
					address: address.toString(),
				},
			}),

		transactionHistory: (
			input: TransactionHistoryRequestInput,
		): Observable<AccountTransactionsEndpoint.DecodedResponse> =>
			toObs(a => a['accountTransactions'], {
				account_identifier: {
					address: input.address.toString(),
				},
				network: input.address.network,
				limit: input.size,
				cursor: input.cursor?.toString(),
			}),

		nativeToken: (
			network: string,
		): Observable<NativeTokenInfoEndpoint.DecodedResponse> =>
			toObs(a => a['nativeTokenInfo'], {
				network,
			}),

		tokenInfo: (
			rri: ResourceIdentifierT,
		): Observable<TokenInfoEndpoint.DecodedResponse> =>
			toObs(a => a['tokenInfo'], {
				network: rri.network,
				token_identifier: {
					rri: rri.toString(),
				},
			}),

		stakesForAddress: (
			address: AccountAddressT,
		): Observable<StakePositionsEndpoint.DecodedResponse> =>
			toObs(a => a['stakePositions'], {
				network: address.network,
				account_identifier: {
					address: address.toString(),
				},
			}),
		/*
				unstakesForAddress: (
					address: AccountAddressT,
				): Observable<UnstakePositionsEndpoint.DecodedResponse> =>
					toObs(a => a['unstakePositions'], {
						accountUnstakesRequest: {
							network: address.network,
							accountIdentifier: {
								address: address.toString(),
							},
						},
					}),
					*/

		transactionStatus: (
			txID: TransactionIdentifierT,
			network: string,
		): Observable<TransactionEndpoint.DecodedResponse> =>
			toObs(a => a['getTransaction'], {
				network,
				transaction_identifier: {
					hash: txID.toString(),
				},
			}),

		buildTransaction: (
			transactionIntent: TransactionIntent,
			from: AccountAddressT,
		): Observable<BuildTransactionEndpoint.DecodedResponse> =>
			toObs(a => a['buildTransaction'], {
				network: from.network,
				actions: transactionIntent.actions.map(action =>
					action.type === ActionType.TOKEN_TRANSFER
						? {
								type: 'TransferTokens',
								from: {
									address: action.from.toString(),
								},
								to: {
									address: action.to.toString(),
								},
								amount: {
									value: action.amount.toString(),
									token_identifier: {
										rri: action.rri.toString(),
									},
								},
						  }
						: {
								type:
									action.type === ActionType.STAKE_TOKENS
										? 'StakeTokens'
										: 'UnstakeTokens',
								from: {
									address: action.from.toString(),
								},
								to: {
									address: action.validator.toString(),
								},
								amount: {
									value: action.amount.toString(),
									token_identifier: {
										rri: action.rri.toString(),
									},
								},
						  },
				),
				fee_payer: {
					address: from.toString(),
				},
				message: transactionIntent.message
					? transactionIntent.message.toString('hex')
					: undefined,
				disable_token_mint_and_burn: true,
			}),

		finalizeTransaction: (
			network: string,
			signedTransaction: SignedTransaction,
		): Observable<FinalizeTransactionEndpoint.DecodedResponse> =>
			toObs(a => a['finalizeTransaction'], {
				network,
				unsigned_transaction: signedTransaction.transaction.blob,
				signature: {
					bytes: signedTransaction.signature.toDER(),
					public_key: signedTransaction.publicKeyOfSigner.toString(),
				},
			}),

		submitSignedTransaction: (
			network: string,
			finalizedTx: FinalizedTransaction,
		): Observable<SubmitTransactionEndpoint.DecodedResponse> => {
			console.log('WHAT', finalizedTx)
			return toObs(a => a['submitTransaction'], {
				network,
				signed_transaction: finalizedTx.blob,
			})
		},
	}
}

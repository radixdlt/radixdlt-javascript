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
	TransactionIdentifierT
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
		/*
		validators: (
			input: ValidatorsEndpoint.Input,
		): Observable<ValidatorsEndpoint.DecodedResponse> =>
			toObs(a => a['validators'], {
				validatorsRequest: {
					network: input.network,
				},
			}),

		lookupValidator: (
			input: ValidatorAddressT,
		): Observable<ValidatorEndpoint.DecodedResponse> =>
			toObs(a => a['validator'], {
				validatorInfoRequest: {
					network: input.network,
					validatorIdentifier: {
						address: input.toString(),
					},
				},
			}),
*/
		networkId: (): Observable<Network> =>
			toObsMap(
				a => a['network'],
				m => m.network,
				{
					body: {},
				},
			),
		/*
				tokenBalancesForAddress: (
					address: AccountAddressT,
				): Observable<AccountBalancesEndpoint.DecodedResponse> =>
					toObs(a => a['accountBalances'], {
						accountBalancesRequest: {
							network: address.network,
							accountIdentifier: {
								address: address.toString(),
							},
						},
					}),
		
				transactionHistory: (
					input: TransactionHistoryRequestInput,
				): Observable<AccountTransactionsEndpoint.DecodedResponse> =>
					toObs(a => a['accountTransactions'], {
						accountTransactionsRequest: {
							accountIdentifier: {
								address: input.address.toString(),
							},
							network: input.address.network,
							limit: input.size,
							cursor: input.cursor?.toString(),
						},
					}),
		
				nativeToken: (
					network: string,
				): Observable<NativeTokenInfoEndpoint.DecodedResponse> =>
					toObs(a => a['nativeTokenInfo'], {
						tokenNativeRequest: {
							network,
						},
					}),
		*/
		tokenInfo: (
			rri: ResourceIdentifierT,
		): Observable<TokenInfoEndpoint.DecodedResponse> =>
			toObs(a => a['tokenInfo'], {
				tokenRequest: {
					network: rri.network,
					tokenIdentifier: {
						rri: rri.toString(),
					},
				},
			}),
		/*
				stakesForAddress: (
					address: AccountAddressT,
				): Observable<StakePositionsEndpoint.DecodedResponse> =>
					toObs(a => a['stakePositions'], {
						accountStakesRequest: {
							network: address.network,
							accountIdentifier: {
								address: address.toString(),
							},
						},
					}),
		
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
		
				transactionStatus: (
					txID: TransactionIdentifierT,
					network: string
				): Observable<TransactionEndpoint.DecodedResponse> =>
					toObs(a => a['transactionStatus'], {
						transactionStatusRequest: {
							network,
							transactionIdentifier: {
								hash: txID.toString(),
							}
						}
					}),
		
		
				buildTransaction: (
					transactionIntent: TransactionIntent,
					from: AccountAddressT,
				): Observable<BuildTransactionEndpoint.DecodedResponse> =>
					toObs(a => a['buildTransaction'], {
						transactionBuildRequest: {
							network: from.network,
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
							feePayer: {
								address: from.toString(),
							},
							message: transactionIntent.message
								? transactionIntent.message.toString('hex')
								: undefined,
							disableTokenMintAndBurn: true,
						},
					}),
		
				finalizeTransaction: (
					network: string,
					signedTransaction: SignedTransaction,
				): Observable<FinalizeTransactionEndpoint.DecodedResponse> =>
					toObs(a => a['finalizeTransaction'], {
						transactionFinalizeRequest: {
							network,
							unsignedTransaction:
								signedTransaction.transaction.hashOfBlobToSign,
							signature: { bytes: signedTransaction.signature.toDER() },
						},
					}),
		
				submitSignedTransaction: (
					network: string,
					finalizedTx: FinalizedTransaction,
				): Observable<SubmitTransactionEndpoint.DecodedResponse> =>
					toObs(a => a['submitTransaction'], {
						transactionSubmitRequest: {
							network,
							signedTransaction: finalizedTx.blob,
						},
					}),
			}
			*/
	}
}

import { catchError, EMPTY, from, mergeMap, tap } from 'rxjs'
import {
	BuiltTransaction,
	TransactionIntent,
	TransactionTrackingEventType,
} from '../dto'
import { AccountT } from '../_types'
import { log, toObservableFromResult } from '@util'
import { RadixAPI } from '../api'
import { Track, TrackError } from './_types'

export const buildTx =
	({
		account,
		radixAPI,
		track,
		trackError,
	}: {
		account: AccountT
		radixAPI: RadixAPI
		track: Track
		trackError: TrackError
	}) =>
	(txIntent: TransactionIntent) => {
		log.debug(
			'Transaction intent created => requesting 🛰 API to build it now.',
		)
		track({
			transactionState: txIntent,
			eventUpdateType: TransactionTrackingEventType.INITIATED,
		})

		return from(radixAPI.buildTransaction(account.address)(txIntent)).pipe(
			mergeMap(x => toObservableFromResult<BuiltTransaction, Error[]>(x)),
			tap(builtTx => {
				log.debug(
					'TX built by API => asking for confirmation to sign...',
				)

				track({
					transactionState: builtTx,
					eventUpdateType:
						TransactionTrackingEventType.BUILT_FROM_INTENT,
				})
			}),
			catchError((error: Error) => {
				trackError({
					error,
					inStep: TransactionTrackingEventType.BUILT_FROM_INTENT,
				})
				return EMPTY
			}),
		)
	}

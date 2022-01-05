import { Network, RadixAPI, toObservableFromResult } from '@application'
import { catchError, EMPTY, from, mergeMap, tap } from 'rxjs'
import {
	FinalizedTransaction,
	PendingTransaction,
	TransactionTrackingEventType,
} from '../dto'
import { log } from '@util'
import { Track, TrackError } from './_types'

export const submitTx =
	({
		network,
		radixAPI,
		track,
		trackError,
	}: {
		network: Network
		radixAPI: RadixAPI
		track: Track
		trackError: TrackError
	}) =>
	(finalizedTx: FinalizedTransaction) => {
		return from(
			radixAPI.submitSignedTransaction(network, finalizedTx),
		).pipe(
			mergeMap(tx => toObservableFromResult(tx)),
			tap((pendingTx: PendingTransaction) => {
				log.debug(
					`Submitted transaction with txID='${pendingTx.txID.toPrimitive()}', it is now pending.`,
				)
				track({
					transactionState: pendingTx,
					eventUpdateType: TransactionTrackingEventType.SUBMITTED,
				})
			}),
			catchError((submitTXError: Error) => {
				log.error(
					`Submission of signed transaction to API failed with error: ${submitTXError.message}`,
				)
				trackError({
					error: submitTXError,
					inStep: TransactionTrackingEventType.SUBMITTED,
				})
				return EMPTY
			}),
		)
	}

import { catchError, EMPTY, from, mergeMap, tap } from 'rxjs'
import {
	FinalizedTransaction,
	SignedTransaction,
	TransactionTrackingEventType,
} from '../dto'
import { log, toObservableFromResult } from '@util'
import { RadixAPI } from '../api'
import { Track, TrackError } from './_types'
import { Network } from '@application'

export const finalizeTx =
	({
		track,
		trackError,
		network,
		radixAPI,
	}: {
		track: Track
		trackError: TrackError
		network: Network
		radixAPI: RadixAPI
	}) =>
	(signedTx: SignedTransaction) => {
		log.debug(`Finished signing tx => submitting it to 🛰  API.`)

		return from(radixAPI.finalizeTransaction(network, signedTx)).pipe(
			mergeMap(x => toObservableFromResult(x)),
			catchError((e: Error) => {
				log.error(
					`API failed to submit transaction, error: ${JSON.stringify(
						e,
						null,
						4,
					)}`,
				)
				trackError({
					error: e,
					inStep: TransactionTrackingEventType.FINALIZED,
				})
				return EMPTY
			}),
			tap<FinalizedTransaction>(finalizedTx => {
				log.debug(
					`Received finalized transaction' from API, calling submit.`,
				)
				track({
					transactionState: finalizedTx,
					eventUpdateType: TransactionTrackingEventType.FINALIZED,
				})
			}),
		)
	}

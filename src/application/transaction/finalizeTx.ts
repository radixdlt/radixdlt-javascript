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
  (
    track: Track,
    network: Network,
    radixAPI: RadixAPI,
    trackError: TrackError,
  ) =>
  (signedTx: SignedTransaction) =>
    radixAPI
      .finalizeTransaction(network, signedTx)
      .map(finalizedTx => {
        log.debug('Successfully finalized transaction.')
        track({
          transactionState: finalizedTx,
          eventUpdateType: TransactionTrackingEventType.FINALIZED,
        })
        return finalizedTx
      })
      .mapErr(e => {
        log.error(
          `API failed to finalize transaction, errors: ${e.forEach(
            e => e.message,
          )}`,
        )
        trackError({
          errors: e,
          inStep: TransactionTrackingEventType.FINALIZED,
        })
        return e
      })

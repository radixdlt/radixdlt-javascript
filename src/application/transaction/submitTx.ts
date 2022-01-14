import { Network, RadixAPI } from '@application'
import {
  FinalizedTransaction,
  PendingTransaction,
  TransactionTrackingEventType,
} from '../dto'
import { log } from '@util'
import { Track, TrackError } from './_types'

export const submitTx =
  (
    track: Track,
    network: Network,
    radixAPI: RadixAPI,
    trackError: TrackError,
  ) =>
  (finalizedTx: FinalizedTransaction) =>
    radixAPI
      .submitSignedTransaction(network, finalizedTx)
      .map((pendingTx: PendingTransaction) => {
        log.debug(
          `Submitted transaction with txID=${pendingTx.txID.toPrimitive()}`,
        )
        track({
          transactionState: pendingTx,
          eventUpdateType: TransactionTrackingEventType.SUBMITTED,
        })
        return pendingTx
      })
      .mapErr(e => {
        log.error(
          `Submission of signed transaction to API failed with errors: ${e.map(
            e => e.message,
          )}`,
        )
        trackError({
          errors: e,
          inStep: TransactionTrackingEventType.SUBMITTED,
        })
        return e
      })

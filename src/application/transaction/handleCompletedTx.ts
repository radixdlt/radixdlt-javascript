import { log, radixAPIError } from '@util'
import { Observable, Subscription, tap } from 'rxjs'
import {
  SimpleExecutedTransaction,
  TransactionIdentifierT,
  TransactionStatus,
  TransactionTrackingEventType,
} from '../dto'
import { Track, TrackError } from './_types'

export const handleCompletedTx =
  (
    track: Track,
    sendTxSuccess: (tx: TransactionIdentifierT) => void,
    trackError: TrackError,
  ) =>
  (obs: Observable<SimpleExecutedTransaction>) => {
    const handleSuccessfulTx = (
      tx: SimpleExecutedTransaction,
      sub: Subscription,
    ) => {
      log.info(
        `Transaction with txID='${tx.toString()}' has completed successfully.`,
      )
      track({
        transactionState: tx,
        eventUpdateType: TransactionTrackingEventType.COMPLETED,
      })
      sendTxSuccess(tx.txID)
      sub.unsubscribe()
    }

    const handleFailedTx = (
      tx: SimpleExecutedTransaction,
      sub: Subscription,
    ) => {
      const errMsg = `API status of tx with id=${tx.txID.toPrimitive()} returned 'FAILED'`
      log.error(errMsg)
      trackError({
        errors: [radixAPIError({ message: errMsg })],
        inStep: TransactionTrackingEventType.STATUS_UPDATE,
      })
      sub.unsubscribe()
    }

    const sub: Subscription = obs.subscribe(tx =>
      tx.status === TransactionStatus.CONFIRMED
        ? handleSuccessfulTx(tx, sub)
        : handleFailedTx(tx, sub),
    )
  }

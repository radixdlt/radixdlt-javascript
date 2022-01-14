import { Network, RadixAPI } from '@application'
import {
  catchError,
  distinctUntilChanged,
  EMPTY,
  from,
  map,
  mergeMap,
  Observable,
  skipWhile,
  take,
  tap,
} from 'rxjs'
import {
  PendingTransaction,
  TransactionStatus,
  TransactionTrackingEventType,
} from '../dto'
import { log } from '@util'
import { Track } from './_types'

export const pollTxStatus =
  (
    track: Track,
    network: Network,
    radixAPI: RadixAPI,
    pollTrigger$: Observable<unknown>,
  ) =>
  (pendingTx: PendingTransaction) =>
    pollTrigger$.pipe(
      mergeMap(() => {
        log.debug(
          `Asking API for status of transaction with txID: ${pendingTx.txID.toPrimitive()}`,
        )

        return from(radixAPI.transactionStatus(pendingTx.txID, network))
      }),
      map(tx => tx._unsafeUnwrap()),
      distinctUntilChanged((prev, cur) => prev.status === cur.status),
      tap(tx => {
        log.debug(
          `Status ${
            tx.status
          } of transaction with txID='${tx.txID.toPrimitive()}'`,
        )
        track({
          transactionState: tx,
          eventUpdateType: TransactionTrackingEventType.STATUS_UPDATE,
        })
      }),
      catchError((transactionStatusError: Error) => {
        log.error(`Failed to get status of transaction`, transactionStatusError)
        return EMPTY
      }),
      skipWhile(
        tx =>
          ![TransactionStatus.CONFIRMED, TransactionStatus.FAILED].includes(
            tx.status,
          ),
      ),
      take(1),
    )

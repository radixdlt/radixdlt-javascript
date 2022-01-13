import { interval, ReplaySubject } from 'rxjs'
import {
  TransactionIdentifierT,
  TransactionStateUpdate,
  TransactionTrackingEventType,
} from '../dto'
import {
  MakeTxFromIntentInput as TransactionInput,
  SendTxOutput as TransactionOutput,
  SendTxError,
  TrackErrorInput,
} from './_types'

import { finalizeTx as _finalizeTx } from './finalizeTx'
import { submitTx as _submitTx } from './submitTx'
import { signTx as _signTx } from './signTx'
import { buildTx as _buildTx } from './buildTx'
import { pollTxStatus as _pollStatusOfTx } from './pollTxStatus'
import { userConfirmation as _userConfirmation } from './userConfirmation'
import { handleCompletedTx as _handleCompletedTx } from './handleCompletedTx'
import { ResultAsync } from 'neverthrow'

export const sendTransaction = ({
  account,
  txIntent,
  radixAPI,
  network,
  options,
}: TransactionInput): TransactionOutput => {
  const eventSubject = new ReplaySubject<TransactionStateUpdate>()

  let confirm: (tx: TransactionIdentifierT) => void
  let reject: (err: SendTxError) => void

  const sendTxSuccess = (tx: TransactionIdentifierT) => confirm(tx)
  const sendTxError = (err: SendTxError) => reject(err)

  const completion = new Promise<TransactionIdentifierT>((resolve, _reject) => {
    confirm = resolve
    reject = _reject
  })

  const track = (event: TransactionStateUpdate) => {
    eventSubject.next(event)
  }

  const trackError = (input: TrackErrorInput) => {
    const errorEvent = {
      eventUpdateType: input.inStep,
      errors: input.errors,
    }
    sendTxError(errorEvent)
  }

  const buildTx = _buildTx(track, account, radixAPI, trackError)
  const userConfirmation = _userConfirmation(track, options)
  const signTx = _signTx(track, account, txIntent, trackError)
  const finalizeTx = _finalizeTx(track, network, radixAPI, trackError)
  const submitTx = _submitTx(track, network, radixAPI, trackError)
  const pollStatusOfTx = _pollStatusOfTx(
    track,
    network,
    radixAPI,
    options.pollTXStatusTrigger ?? interval(1000),
  )
  const handleCompletedTx = _handleCompletedTx(track, sendTxSuccess, trackError)

  track({
    transactionState: txIntent,
    eventUpdateType: TransactionTrackingEventType.INITIATED,
  })

  buildTx(txIntent)
    .andThen(userConfirmation)
    .andThen(signTx)
    .andThen(finalizeTx)
    .andThen(submitTx)
    .map(pollStatusOfTx)
    .map(handleCompletedTx)

  return {
    completion: ResultAsync.fromPromise<TransactionIdentifierT, SendTxError>(
      completion,
      e => e as SendTxError,
    ),
    events: eventSubject.asObservable(),
  }
}

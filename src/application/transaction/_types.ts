import { MakeTransactionOptions, Network, RadixError } from '@application'
import { ResultAsync } from 'neverthrow'
import { Observable, Subject } from 'rxjs'
import { RadixAPI } from '../api'
import {
  BuiltTransaction,
  TransactionIdentifierT,
  TransactionIntent,
  TransactionStateUpdate,
  TransactionTrackingEventType,
} from '../dto'
import { AccountT } from '../_types'

export type AskUserToConfirmSubject = Subject<BuiltTransaction>

export type TrackErrorInput = {
  errors: RadixError[]
  inStep: TransactionTrackingEventType
}

export type TrackError = (event: TrackErrorInput) => void

export type Track = (event: TransactionStateUpdate) => void

export type MakeTxFromIntentInput = {
  account: AccountT
  txIntent: TransactionIntent
  radixAPI: RadixAPI
  network: Network
  options: MakeTransactionOptions
}

export type SendTxError = {
  eventUpdateType: TransactionTrackingEventType
  errors: RadixError[]
}

export type SendTxOutput = {
  completion: ResultAsync<TransactionIdentifierT, SendTxError>
  events: Observable<TransactionStateUpdate>
}

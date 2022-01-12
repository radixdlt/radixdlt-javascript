import { MakeTransactionOptions, Network } from '@application'
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
	errors: Error[]
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

export type MakeTxFromIntentOutput = {
	completion: Promise<TransactionIdentifierT>
	events: Observable<TransactionStateUpdate>
}

export type SendTxError = {
	eventUpdateType: TransactionTrackingEventType
	errors: Error[]
}

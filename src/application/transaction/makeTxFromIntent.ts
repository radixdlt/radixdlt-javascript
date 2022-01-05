import { interval, mergeMap, ReplaySubject, Subject } from 'rxjs'
import {
	SimpleExecutedTransaction,
	TransactionIdentifierT,
	TransactionStateError,
	TransactionStateUpdate,
	TransactionStatus,
	TransactionTrackingEventType,
} from '../dto'
import { log } from '@util'
import {
	MakeTxFromIntentInput,
	MakeTxFromIntentOutput,
	TrackErrorInput,
} from './_types'

import { finalizeTx as _finalizeTx } from './finalizeTx'
import { submitTx as _submitTx } from './submitTx'
import { signTx as _signTx } from './signTx'
import { buildTx as _buildTx } from './buildTx'
import { pollStatusOfTx as _pollStatusOfTx } from './pollStatusOfTx'
import { userConfirmation as _userConfirmation } from './userConfirmation'

export const makeTxFromIntent = ({
	account,
	txIntent,
	radixAPI,
	network,
	options,
}: MakeTxFromIntentInput): MakeTxFromIntentOutput => {
	const trackingSubject = new ReplaySubject<TransactionStateUpdate>()
	const completionSubject = new Subject<TransactionIdentifierT>()
	const userDidConfirmTxSubject = new ReplaySubject<void>()

	const track = (event: TransactionStateUpdate) => {
		trackingSubject.next(event)
	}

	const trackError = (input: TrackErrorInput) => {
		log.debug(`Forwarding error to 'errorSubject'`)
		const errorEvent: TransactionStateError = {
			eventUpdateType: input.inStep,
			error: input.error,
		}
		track(errorEvent)
		completionSubject.error(errorEvent.error)
	}

	const buildTx = _buildTx({
		account,
		radixAPI,
		track,
		trackError,
	})

	const userConfirmation = _userConfirmation({
		options,
		userDidConfirmTxSubject,
		track,
	})

	const signTx = _signTx({ account, txIntent, track })

	const finalizeTx = _finalizeTx({
		radixAPI,
		network,
		track,
		trackError,
	})

	const submitTx = _submitTx({
		network,
		radixAPI,
		track,
		trackError,
	})

	const pollStatusOfTx = _pollStatusOfTx({
		network,
		radixAPI,
		pollTrigger$: options.pollTXStatusTrigger ?? interval(1000),
		track,
	})

	const handleSuccessfulTx = (tx: SimpleExecutedTransaction) => {
		log.info(
			`Transaction with txID='${tx.toString()}' has completed succesfully.`,
		)
		track({
			transactionState: tx,
			eventUpdateType: TransactionTrackingEventType.COMPLETED,
		})

		completionSubject.next(tx.txID)
		completionSubject.complete()
		sendTx.unsubscribe()
	}

	const handleFailedTx = (tx: SimpleExecutedTransaction) => {
		const errMsg = `API status of tx with id=${tx.txID.toPrimitive()} returned 'FAILED'`
		log.error(errMsg)
		trackError({
			error: new Error(errMsg),
			inStep: TransactionTrackingEventType.UPDATE_OF_STATUS_OF_PENDING_TX,
		})
		sendTx.unsubscribe()
	}

	const sendTx = buildTx(txIntent)
		.pipe(
			mergeMap(userConfirmation),
			mergeMap(signTx),
			mergeMap(finalizeTx),
			mergeMap(submitTx),
			mergeMap(pollStatusOfTx),
		)
		.subscribe(tx =>
			tx.status === TransactionStatus.CONFIRMED
				? handleSuccessfulTx(tx)
				: handleFailedTx(tx),
		)

	return {
		completion: completionSubject.asObservable(),
		events: trackingSubject.asObservable(),
	}
}

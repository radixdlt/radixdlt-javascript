import { interval, mergeMap, ReplaySubject, Subject, Subscription } from 'rxjs'
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
	MakeTxFromIntentInput as TransactionInput,
	MakeTxFromIntentOutput as TransactionOutput,
	TrackErrorInput,
} from './_types'

import { finalizeTx as _finalizeTx } from './finalizeTx'
import { submitTx as _submitTx } from './submitTx'
import { signTx as _signTx } from './signTx'
import { buildTx as _buildTx } from './buildTx'
import { pollTxStatus as _pollStatusOfTx } from './pollTxStatus'
import { userConfirmation as _userConfirmation } from './userConfirmation'

export const sendTransaction = ({
	account,
	txIntent,
	radixAPI,
	network,
	options,
}: TransactionInput): TransactionOutput => {
	const eventSubject = new ReplaySubject<TransactionStateUpdate>()
	const completionSubject = new Subject<TransactionIdentifierT>()

	const track = (event: TransactionStateUpdate) => {
		eventSubject.next(event)
	}

	const trackError = (input: TrackErrorInput) => {
		const errorEvent = {
			eventUpdateType: input.inStep,
			errors: input.errors,
		}
		completionSubject.error(errorEvent)
	}

	const buildTx = _buildTx(track, account, radixAPI, trackError)
	const userConfirmation = _userConfirmation(track, options)
	const signTx = _signTx(track, account, txIntent)
	const finalizeTx = _finalizeTx(track, network, radixAPI, trackError)
	const submitTx = _submitTx(track, network, radixAPI, trackError)
	const pollStatusOfTx = _pollStatusOfTx(track, network, radixAPI, options.pollTXStatusTrigger ?? interval(1000))

	const handleSuccessfulTx = (tx: SimpleExecutedTransaction, txSub: Subscription) => {
		log.info(
			`Transaction with txID='${tx.toString()}' has completed successfully.`,
		)
		track({
			transactionState: tx,
			eventUpdateType: TransactionTrackingEventType.COMPLETED,
		})

		completionSubject.next(tx.txID)
		completionSubject.complete()
		txSub.unsubscribe()
	}

	const handleFailedTx = (tx: SimpleExecutedTransaction, txSub: Subscription) => {
		const errMsg = `API status of tx with id=${tx.txID.toPrimitive()} returned 'FAILED'`
		log.error(errMsg)
		trackError({
			errors: [Error(errMsg)],
			inStep: TransactionTrackingEventType.STATUS_UPDATE,
		})
		txSub.unsubscribe()
	}

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
		.map(obs => {
			const sub: Subscription = obs.subscribe(tx =>
				tx.status === TransactionStatus.CONFIRMED
					? handleSuccessfulTx(tx, sub)
					: handleFailedTx(tx, sub),
			)
		})

	return {
		completion: completionSubject.asObservable(),
		events: eventSubject.asObservable(),
	}
}
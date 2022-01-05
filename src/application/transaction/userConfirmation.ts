import { MakeTransactionOptions } from '../_types'
import { log } from '@util'
import { mapTo, ReplaySubject, tap } from 'rxjs'
import { BuiltTransaction, TransactionTrackingEventType } from '../dto'
import { Track } from './_types'

export const userConfirmation =
	({
		options,
		userDidConfirmTxSubject,
		track,
	}: {
		options: MakeTransactionOptions
		userDidConfirmTxSubject: ReplaySubject<void>
		track: Track
	}) =>
	(builtTx: BuiltTransaction) => {
		track({
			transactionState: builtTx,
			eventUpdateType:
				TransactionTrackingEventType.ASKED_FOR_CONFIRMATION,
		})

		if (options.userConfirmation === 'skip') {
			log.debug(
				'Transaction has been setup to be automatically confirmed, requiring no final confirmation input from user.',
			)
			userDidConfirmTxSubject.next()
		} else {
			log.log(
				`Transaction has been setup so that it requires a manual final confirmation from user before being finalized.`,
			)
			options.userConfirmation.next({
				txToConfirm: builtTx,
				confirm: () => userDidConfirmTxSubject.next(),
			})
		}
		return userDidConfirmTxSubject.pipe(
			tap(() => {
				track({
					transactionState: builtTx,
					eventUpdateType: TransactionTrackingEventType.CONFIRMED,
				})
			}),
			mapTo(builtTx),
		)
	}

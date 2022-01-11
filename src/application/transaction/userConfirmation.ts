import { MakeTransactionOptions } from '../_types'
import { mapTo, tap } from 'rxjs'
import { BuiltTransaction, TransactionTrackingEventType } from '../dto'
import { Track } from './_types'
import { ResultAsync } from 'neverthrow'

export const userConfirmation = (
	track: Track,
	options: MakeTransactionOptions
) => (
	tx: BuiltTransaction
) => {
		let confirm: () => void
		let reject: () => void

		const confirmTx = () => confirm()
		const rejectTx = () => reject()

		const confirmation = new Promise<void>((resolve, reject) => {
			confirm = resolve
			reject = reject
		})

		if (!options.userConfirmation) {
			confirmTx()
		} else {
			options.userConfirmation(confirmTx, rejectTx, tx)
		}

		return ResultAsync.fromPromise(confirmation.then(_ => {
			track({
				transactionState: tx,
				eventUpdateType: TransactionTrackingEventType.CONFIRMED,
			})
			return tx
		}), _ => Error('Transaction was rejected.'))
	}

import {
	TransactionIntent,
	TransactionTrackingEventType,
} from '../dto'
import { AccountT } from '../_types'
import { log } from '@util'
import { RadixAPI } from '../api'
import { Track, TrackError } from './_types'

export const buildTx = (
	track: Track,
	account: AccountT,
	radixAPI: RadixAPI,
	trackError: TrackError
) =>
	(txIntent: TransactionIntent) => radixAPI.buildTransaction(account.address)(txIntent)
		.map(builtTx => {
			log.debug(
				'Transaction built successfully.',
			)
			track({
				transactionState: builtTx,
				eventUpdateType: TransactionTrackingEventType.BUILT,
			})
			return builtTx
		}).mapErr(e => {
			trackError({
				errors: e,
				inStep: TransactionTrackingEventType.BUILT,
			})
			return e
		})


import { map, Observable, tap, throwError } from 'rxjs'
import { ActionType, TransferTokensAction } from '../actions'
import {
	BuiltTransaction,
	SignedTransaction,
	TransactionIntent,
	TransactionTrackingEventType,
} from '../dto'
import { AccountT } from '../_types'
import { log } from '@util'
import { Track } from './_types'

const getNonXRDHRPsOfRRIsInTx = ({ actions }: TransactionIntent): string[] =>
	actions
		.filter(a => a.type === ActionType.TRANSFER)
		.map(a => a as TransferTokensAction)
		.filter(t => t.rri.name !== 'xrd')
		.map(t => t.rri.name)

export const signTx =
	({
		account,
		txIntent,
		track,
	}: {
		account: AccountT
		txIntent: TransactionIntent
		track: Track
	}) =>
	(builtTx: BuiltTransaction): Observable<SignedTransaction> => {
		const nonXRDHRPsOfRRIsInTx = getNonXRDHRPsOfRRIsInTx(txIntent)

		const uniqueNonXRDHRPsOfRRIsInTx = [...new Set(nonXRDHRPsOfRRIsInTx)]

		if (uniqueNonXRDHRPsOfRRIsInTx.length > 1) {
			const errMsg = `Error cannot sign transaction with multiple non-XRD RRIs. Unsupported by Ledger app.`
			log.error(errMsg)
			return throwError(() => new Error(errMsg))
		}

		const nonXRDHrp = uniqueNonXRDHRPsOfRRIsInTx[0]

		log.debug('Starting signing transaction (async).')

		return account.sign(builtTx.transaction, nonXRDHrp).pipe(
			map((signature): SignedTransaction => {
				const publicKeyOfSigner = account.publicKey
				log.debug(`Finished signing transaction`)
				return {
					transaction: builtTx.transaction,
					signature,
					publicKeyOfSigner,
				}
			}),
			tap(signedTx => {
				track({
					transactionState: signedTx,
					eventUpdateType: TransactionTrackingEventType.SIGNED,
				})
			}),
		)
	}

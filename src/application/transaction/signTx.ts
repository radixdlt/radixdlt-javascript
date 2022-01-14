import { ActionType, IntendedAction, TransferTokensAction } from '../actions'
import {
  BuiltTransaction,
  SignedTransaction,
  TransactionIntent,
  TransactionTrackingEventType,
} from '../dto'
import { AccountT } from '../_types'
import { log } from '@util'
import { Track } from './_types'
import { errAsync } from 'neverthrow'

const getUniqueNonXrdTokensFromTransfers = (
  actions: IntendedAction[],
): string[] => [
  ...new Set(
    actions
      .filter(action => action.type === ActionType.TRANSFER)
      .map(action => action as TransferTokensAction)
      .filter(transferAction => transferAction.rri.name !== 'xrd')
      .map(transferAction => transferAction.rri.name),
  ),
]

export const signTx =
  (track: Track, account: AccountT, txIntent: TransactionIntent) =>
  (builtTx: BuiltTransaction) => {
    const nonXrdTokenNames = getUniqueNonXrdTokensFromTransfers(
      txIntent.actions,
    )

    if (nonXrdTokenNames.length > 1)
      return errAsync(
        Error(
          `Cannot sign transaction with multiple non-XRD RRIs. Unsupported by Ledger app.`,
        ),
      )

    const nonXRDHrp = nonXrdTokenNames[0]

    log.debug('Starting signing transaction.')

    return account.sign(builtTx.transaction, nonXRDHrp).map(signature => {
      const signedTx: SignedTransaction = {
        transaction: builtTx.transaction,
        signature,
        publicKeyOfSigner: account.publicKey,
      }

      log.debug(`Finished signing transaction`)
      track({
        transactionState: signedTx,
        eventUpdateType: TransactionTrackingEventType.SIGNED,
      })
      return signedTx
    })
  }

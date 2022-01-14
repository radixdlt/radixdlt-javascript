import BigNumber from 'bignumber.js'
import {
  SimpleExecutedTransaction,
  SimpleTokenBalance,
  SimpleTokenBalances,
  SimpleTransactionHistory,
} from '..'
import { AmountT } from '@primitives'
import { ExecutedAction, ActionType } from '../actions'

export const stringifyAmount = (amount: AmountT) => {
  const factor = new BigNumber('1e18')
  const bigNumber = new BigNumber(amount.toString())
  const precision = 4
  return bigNumber.dividedToIntegerBy(factor).toFormat(precision)
}

export const stringifyAction = (action: ExecutedAction): string => {
  switch (action.type) {
    case ActionType.OTHER:
      return `
		Other
		`
    case ActionType.STAKE:
      return `
			type: ${action.type.toString()},
			from_account: ${action.from_account.toString()}
			to_validator: ${action.to_validator.toString()}
			amount: ${stringifyAmount(action.amount)}
			`
    case ActionType.UNSTAKE:
      return `
		type: ${action.type.toString()},
		from_validator: ${action.from_validator.toString()}
		to_account: ${action.to_account.toString()}
		amount: ${action.amount && stringifyAmount(action.amount)}
		`
    case ActionType.TRANSFER:
      return `
		type: ${action.type.toString()},
		from_account: ${action.from_account.toString()}
		to_account: ${action.to_account.toString()}
		amount: ${stringifyAmount(action.amount)}
		rri: ${action.rri.toString()}
		`
  }
  return 'ERROR'
}

export const stringifySimpleTX = (tx: SimpleExecutedTransaction): string => `
	txID: ${tx.txID.toString()}
	fee: ${stringifyAmount(tx.fee)}
	sentAt: ${tx.sentAt.toLocaleString()}
	message: ${tx.message !== undefined ? tx.message : '<NONE>'}
	actions: [
	${tx.actions.map(a => stringifyAction(a)).join('\n')}
	]
	`

export const stringifySimpleTXHistory = (
  simpleTxHist: SimpleTransactionHistory,
): string =>
  `transactions: ${simpleTxHist.transactions
    .map(t => stringifySimpleTX(t))
    .join('\n')}`

export const stringifySimpleTokenBalance = (tb: SimpleTokenBalance): string => `
		amount: ${stringifyAmount(tb.amount)}
		rri: ${tb.tokenIdentifier.toString()}
	`

export const stringifySimpleTokenBalances = (
  tokenBalances: SimpleTokenBalances,
): string => `
		owner: ${tokenBalances.owner.toString()},
		balances: ${tokenBalances.tokenBalances
      .map(tb => stringifySimpleTokenBalance(tb))
      .join('\n')}
	`

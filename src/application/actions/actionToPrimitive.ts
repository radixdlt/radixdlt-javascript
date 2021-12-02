import { IntendedStakeTokens } from './intendedStakeTokensAction'
import { IntendedTransferTokens } from './intendedTransferTokensAction'
import { IntendedUnstakeTokens } from './intendedUnstakeTokensAction'
import { ActionTypes, ActionType } from './_types'

export const actionToPrimitive = (action: ActionTypes) => {
	switch (action.type) {
		case ActionType.TRANSFER:
			return IntendedTransferTokens.toPrimitive(action)
		case ActionType.STAKE:
			return IntendedStakeTokens.toPrimitive(action)
		case ActionType.UNSTAKE:
			return IntendedUnstakeTokens.toPrimitive(action)

		default:
			return { ...action, type: ActionType.OTHER }
	}
}

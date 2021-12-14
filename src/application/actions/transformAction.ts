import {
	Action as ActionRaw,
	StakeTokens,
	TransferTokens,
	UnstakeTokens,
} from '@networking'
import {
	ActionType,
	stakeTokensAction,
	transferTokensAction,
	unstakeTokensAction,
} from '.'
import { ok } from 'neverthrow'
import { IntendedAction } from './_types'

const toComplex = (action: ActionRaw) => {
	switch (action.type) {
		case ActionType.TRANSFER:
			return transferTokensAction.toComplex(action as TransferTokens)
		case ActionType.STAKE:
			return stakeTokensAction.toComplex(action as StakeTokens)
		case ActionType.UNSTAKE:
			return unstakeTokensAction.toComplex(action as UnstakeTokens)
		default:
			return ok({ ...action, type: ActionType.OTHER })
	}
}

const toPrimitive = (action: IntendedAction) => {
	switch (action.type) {
		case ActionType.TRANSFER:
			return transferTokensAction.toPrimitive(action)
		case ActionType.STAKE:
			return stakeTokensAction.toPrimitive(action)
		case ActionType.UNSTAKE:
			return unstakeTokensAction.toPrimitive(action)
	}
}

export const transformAction = {
	toComplex,
	toPrimitive,
}

import {
	ActionInput,
	IntendedAction,
	StakeTokensInput,
	TransferTokensInput,
	UnstakeTokensInput,
} from '../actions/_types'
import {
	EncryptedMessage,
	TransactionIntent,
	TransactionIntentBuilderState,
	TransactionIntentBuilderT,
} from './_types'
import { AddressT } from '@radixdlt/account'
import { Observable, of, throwError } from 'rxjs'
import {
	IntendedTransferTokens,
	isTransferTokensInput,
} from '../actions/intendedTransferTokensAction'
import {
	IntendedStakeTokens,
	isStakeTokensInput,
} from '../actions/intendedStakeTokensAction'
import {
	IntendedUnstakeTokens,
	isUnstakeTokensInput,
} from '../actions/intendedUnstakeTokensAction'

type IntermediateAction = ActionInput & {
	type: 'transfer' | 'stake' | 'unstake'
}

const create = (): TransactionIntentBuilderT => {
	const intermediateActions: IntermediateAction[] = []
	const message: string | undefined = undefined
	const snapshotState = (): TransactionIntentBuilderState => ({
		actionInputs: intermediateActions,
		message,
	})

	const snapshotBuilderState = (): {
		__state: TransactionIntentBuilderState
	} => ({
		__state: snapshotState(),
	})

	const addAction = (
		input: ActionInput,
		type: 'transfer' | 'stake' | 'unstake',
	): TransactionIntentBuilderT => {
		intermediateActions.push({
			type,
			...input,
		})
		return {
			...methods,
			...snapshotBuilderState(),
		}
	}

	const transferTokens = (
		input: TransferTokensInput,
	): TransactionIntentBuilderT => addAction(input, 'transfer')

	const stakeTokens = (input: StakeTokensInput): TransactionIntentBuilderT =>
		addAction(input, 'stake')

	const unstakeTokens = (
		input: UnstakeTokensInput,
	): TransactionIntentBuilderT => addAction(input, 'unstake')

	const syncBuildIgnoreMessage = (from: AddressT): TransactionIntent => {
		const intendedActions: IntendedAction[] = intermediateActions.map(
			(i): IntendedAction => {
				const intermediateActionType = i.type
				if (intermediateActionType === 'transfer') {
					if (isTransferTokensInput(i)) {
						return IntendedTransferTokens.create(i, from)
					} else {
						throw new Error('Not transfer tokens input')
					}
				} else if (intermediateActionType === 'stake') {
					if (isStakeTokensInput(i)) {
						return IntendedStakeTokens.create(i, from)
					} else {
						throw new Error('Not stake tokens input')
					}
				} else if (intermediateActionType === 'unstake') {
					if (isUnstakeTokensInput(i)) {
						return IntendedUnstakeTokens.create(i, from)
					} else {
						throw new Error('Not unstake tokens input')
					}
				} else {
					throw new Error(
						'Incorrect implementation, forgot something...',
					)
				}
			},
		)

		return {
			actions: intendedActions,
			message: undefined,
		}
	}

	const buildAndEncrypt = (from: AddressT): Observable<TransactionIntent> => {
		const encMsg: EncryptedMessage | undefined =
			message !== undefined
				? {
						msg: `PLAIN_TEXT_BECAUSE_ENCRYPTION_IS_NOT_YET_INPLEMENTED___${message!}`,
						encryptionScheme: 'PLAINTEXT',
				  }
				: undefined

		const builtWithoutMessage = syncBuildIgnoreMessage(from)

		return of({
			...builtWithoutMessage,
			message: encMsg,
		})
	}

	const methods = {
		transferTokens,
		stakeTokens,
		unstakeTokens,
		buildAndEncrypt,
		__syncBuildIgnoreMessage: syncBuildIgnoreMessage,
	}

	return {
		...snapshotBuilderState(),
		...methods,
	}
}

export const TransactionIntentBuilder = {
	create,
}

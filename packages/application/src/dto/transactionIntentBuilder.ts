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

// const stakeTokens = (input: StakeTokensInput): TransactionIntentBuilderT => {
// 	return <TransactionIntentBuilderT>{}
// }
//
// const unstakeTokens = (
// 	input: UnstakeTokensInput,
// ): TransactionIntentBuilderT => {
// 	return <TransactionIntentBuilderT>{}
// }

// const transferTokens = (
// 	transferTokensInput: TransferTokensInput,
// ): TransactionIntentBuilderT => {
// 	return <TransactionIntentBuilderT>{}
// }

type IntermediateAction = ActionInput & {
	type: 'transfer' | 'stake' | 'unstake'
}

type IntermediateTransferType = TransferTokensInput &
	IntermediateAction &
	Readonly<{
		type: 'transfer'
	}>

type IntermediateStakeType = StakeTokensInput &
	IntermediateAction &
	Readonly<{
		type: 'stake'
	}>

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

	const transferTokens = (
		transferTokensInput: TransferTokensInput,
	): TransactionIntentBuilderT => {
		const intermediateTransfer: IntermediateTransferType = {
			type: 'transfer',
			...transferTokensInput,
		}
		intermediateActions.push(intermediateTransfer)
		return {
			...methods,
			...snapshotBuilderState(),
		}
	}

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
		// recursion, referencing this function itself.
		transferTokens: transferTokens,

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

/*
*
export type TransactionIntentBuilderState = Readonly<{
	actionInputs: ActionInput[]
	message?: string
}>*/

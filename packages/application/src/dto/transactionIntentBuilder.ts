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
import { AccountT, AddressT } from '@radixdlt/account'
import { Observable, throwError, of } from 'rxjs'
import { mergeMap } from 'rxjs/operators'
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
import { combine, err, Result } from 'neverthrow'

type IntermediateAction = ActionInput & {
	type: 'transfer' | 'stake' | 'unstake'
}

const create = (): TransactionIntentBuilderT => {
	const intermediateActions: IntermediateAction[] = []
	let message: string | undefined = undefined
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

	const replaceAnyPreviousMessageWithNew = (
		newMessage: string,
	): TransactionIntentBuilderT => {
		message = newMessage
		return {
			...methods,
			...snapshotBuilderState(),
		}
	}

	const syncBuildIgnoreMessage = (
		from: AddressT,
	): Result<TransactionIntent, Error> => {
		return combine(
			intermediateActions.map(
				(i): Result<IntendedAction, Error> => {
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
						return err(
							new Error(
								'Incorrect implementation, forgot something...',
							),
						)
					}
				},
			),
		).map((actions) => ({
			actions,
			message: undefined,
		}))
	}

	const buildAndEncrypt = (from: AccountT): Observable<TransactionIntent> => {
		return from.deriveAddress().pipe(
			mergeMap(
				(address: AddressT): Observable<TransactionIntent> => {
					const encMsg: EncryptedMessage | undefined =
						message !== undefined
							? {
									msg: `PLAIN_TEXT_BECAUSE_ENCRYPTION_IS_NOT_YET_INPLEMENTED___${message}`,
									encryptionScheme: 'PLAINTEXT',
							  }
							: undefined

					const builtWithoutMessageResult = syncBuildIgnoreMessage(
						address,
					)

					if (builtWithoutMessageResult.isErr()) {
						const error = builtWithoutMessageResult.error
						return throwError(
							() => new Error(`Input error: ${error.message}`),
						)
					} else {
						const builtWithoutMessage =
							builtWithoutMessageResult.value
						const value: TransactionIntent = {
							...builtWithoutMessage,
							message: encMsg,
						}
						return of(value)
					}
				},
			),
		)
	}

	const methods = {
		transferTokens,
		stakeTokens,
		unstakeTokens,
		buildAndEncrypt,
		message: replaceAnyPreviousMessageWithNew,
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

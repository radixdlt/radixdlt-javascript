import {
	ActionInput,
	IntendedAction,
	StakeTokensInput,
	TransferTokensInput,
	UnstakeTokensInput,
} from '../actions/_types'
import {
	TransactionIntent,
	TransactionIntentBuilderState,
	TransactionIntentBuilderT,
} from './_types'
import {
	AccountT,
	AddressT,
	EncryptedMessage,
	EncryptionSchemeName,
	toObservableFromResult,
} from '@radixdlt/account'
import { Observable, of } from 'rxjs'
import { map, mergeMap } from 'rxjs/operators'
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
import { PublicKey } from '@radixdlt/crypto'
import { Option } from 'prelude-ts'

type IntermediateAction = ActionInput & {
	type: 'transfer' | 'stake' | 'unstake'
}

const create = (
	input?: Readonly<{
		encryptionSchemeName: EncryptionSchemeName
	}>,
): TransactionIntentBuilderT => {
	const encryptionSchemeName: EncryptionSchemeName =
		input?.encryptionSchemeName ?? EncryptionSchemeName.DO_NOT_ENCRYPT

	const intermediateActions: IntermediateAction[] = []
	let maybePlaintextMsgToEncrypt: Option<string> = Option.none()
	const snapshotState = (): TransactionIntentBuilderState => ({
		actionInputs: intermediateActions,
		message: maybePlaintextMsgToEncrypt.getOrUndefined(),
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
		maybePlaintextMsgToEncrypt = Option.some(newMessage)
		return {
			...methods,
			...snapshotBuilderState(),
		}
	}

	type IntendedActionsFrom = Readonly<{
		intendedActions: IntendedAction[]
		from: AddressT
	}>

	const intendedActionsFromIntermediateActions = (
		from: AddressT,
	): Result<IntendedActionsFrom, Error> => {
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
		).map((intendedActions) => ({ intendedActions, from }))
	}

	const syncBuildIgnoreMessage = (
		from: AddressT,
	): Result<TransactionIntent, Error> => {
		return intendedActionsFromIntermediateActions(from).map(
			({ intendedActions }) => ({
				actions: intendedActions,
				message: undefined,
			}),
		)
	}

	type ActorsInEncryption = {
		encryptingAccount: AccountT
		publicKeysOfReaders: PublicKey[]
	}

	const gatherPublicKeysFromActions = (
		input: Readonly<{
			intendedActionsFrom: IntendedActionsFrom
			encryptingAccount: AccountT
		}>,
	): Observable<ActorsInEncryption> => {
		return input.encryptingAccount.derivePublicKey().pipe(
			map((pk) => {
				const setOfStrings = new Set<string>(pk.toString())

				const publicKeysOfReaders: PublicKey[] = input.intendedActionsFrom.intendedActions.reduce(
					(acc: PublicKey[], action: IntendedAction) => {
						action.getUniqueAddresses().forEach((a) => {
							if (!setOfStrings.has(a.toString())) {
								acc.push(a.publicKey)
								setOfStrings.add(a.toString())
							}
						})
						return acc
					},
					[] as PublicKey[],
				)

				return {
					encryptingAccount: input.encryptingAccount,
					publicKeysOfReaders,
				}
			}),
		)
	}

	const build = (
		input: Readonly<{
			encryptMessageIfAnyWithAccount: Observable<AccountT>
			spendingSender?: Observable<AddressT>
		}>,
	): Observable<TransactionIntent> => {
		const encryptingAccount$ = input.encryptMessageIfAnyWithAccount
		const spendingSender: Observable<AddressT> =
			input.spendingSender ??
			input.encryptMessageIfAnyWithAccount.pipe(
				mergeMap((a) => a.deriveAddress()),
			)
		return spendingSender.pipe(
			mergeMap((from: AddressT) =>
				toObservableFromResult(
					intendedActionsFromIntermediateActions(from),
				),
			),
			mergeMap(
				(
					intendedActionsFrom: IntendedActionsFrom,
				): Observable<TransactionIntent> => {
					return maybePlaintextMsgToEncrypt.match({
						Some: (plaintext) => {
							return encryptingAccount$.pipe(
								mergeMap(
									(
										encryptingAccount: AccountT,
									): Observable<ActorsInEncryption> =>
										gatherPublicKeysFromActions({
											intendedActionsFrom,
											encryptingAccount,
										}),
								),
								mergeMap(
									(
										actors: ActorsInEncryption,
									): Observable<EncryptedMessage> => {
										return actors.encryptingAccount.encrypt(
											{
												plaintext,
												encryptionScheme: encryptionSchemeName,
												publicKeysOfReaders:
													actors.publicKeysOfReaders,
											},
										)
									},
								),
								map(
									(
										enc: EncryptedMessage,
									): TransactionIntent => {
										return {
											actions:
												intendedActionsFrom.intendedActions,
											message: enc,
										}
									},
								),
							)
						},
						None: () => {
							return of<TransactionIntent>({
								actions: intendedActionsFrom.intendedActions,
								message: undefined,
							})
						},
					})
				},
			),
		)
	}

	const methods = {
		transferTokens,
		stakeTokens,
		unstakeTokens,
		build,
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

import {
	ActionInput,
	ActionType,
	IntendedAction,
	IntendedStakeTokensAction,
	IntendedTransferTokensAction,
	IntendedUnstakeTokensAction,
	StakeTokensInput,
	TransferTokensInput,
	UnstakeTokensInput,
} from '../actions/_types'
import {
	TransactionIntent,
	TransactionIntentBuilderDoNotEncryptInput,
	TransactionIntentBuilderEncryptInput,
	TransactionIntentBuilderOptions,
	TransactionIntentBuilderState,
	TransactionIntentBuilderT,
} from './_types'
import {
	AccountT,
	AddressT,
	EncryptedMessage,
	EncryptionSchemeName,
	isAddress,
	toObservableFromResult,
} from '@radixdlt/account'
import { isObservable, Observable, of } from 'rxjs'
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
import { isResourceIdentifier } from './resourceIdentifier'
import { isAmount } from '@radixdlt/primitives'
import log from 'loglevel'

type IntermediateAction = ActionInput & {
	type: 'transfer' | 'stake' | 'unstake'
}

const mustHaveAtLeastOneAction = new Error(
	'A transaction intent must contain at least one of the following actions: TransferToken, StakeTokens or UnstakeTokens',
)

const isIntendedTransferTokensAction = (
	something: unknown,
): something is IntendedTransferTokensAction => {
	const inspection = something as IntendedTransferTokensAction
	return (
		inspection.type === ActionType.TOKEN_TRANSFER &&
		isAddress(inspection.from) &&
		isAddress(inspection.to) &&
		isAmount(inspection.amount) &&
		isResourceIdentifier(inspection.tokenIdentifier)
	)
}

const isIntendedStakeTokensAction = (
	something: unknown,
): something is IntendedStakeTokensAction => {
	const inspection = something as IntendedStakeTokensAction
	return (
		inspection.type === ActionType.STAKE_TOKENS &&
		isAddress(inspection.from) &&
		isAddress(inspection.validator) &&
		isAmount(inspection.amount)
	)
}

const isIntendedUnstakeTokensAction = (
	something: unknown,
): something is IntendedUnstakeTokensAction => {
	const inspection = something as IntendedUnstakeTokensAction
	return (
		inspection.type === ActionType.UNSTAKE_TOKENS &&
		isAddress(inspection.from) &&
		isAddress(inspection.validator) &&
		isAmount(inspection.amount)
	)
}

const getUniqueAddresses = (action: IntendedAction): AddressT[] => {
	if (isIntendedTransferTokensAction(action)) {
		return [action.to, action.from]
	} else if (isIntendedStakeTokensAction(action)) {
		return [action.validator, action.from]
	} else if (isIntendedUnstakeTokensAction(action)) {
		return [action.validator, action.from]
	} else {
		throw new Error('Incorrect impl')
	}
}

const isTransactionIntentBuilderEncryptInput = (
	something: unknown,
): something is TransactionIntentBuilderEncryptInput => {
	const inspection = something as TransactionIntentBuilderEncryptInput
	return (
		inspection.encryptMessageIfAnyWithAccount !== undefined &&
		isObservable(inspection.encryptMessageIfAnyWithAccount) &&
		(inspection.spendingSender !== undefined
			? isObservable(inspection.spendingSender)
			: true)
	)
}

const isTransactionIntentBuilderDoNotEncryptInput = (
	something: unknown,
): something is TransactionIntentBuilderDoNotEncryptInput => {
	if (isTransactionIntentBuilderEncryptInput(something)) {
		return false
	}
	const inspection = something as TransactionIntentBuilderDoNotEncryptInput
	return (
		inspection.spendingSender !== undefined &&
		isObservable(inspection.spendingSender)
	)
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
		if (intermediateActions.length === 0)
			return err(mustHaveAtLeastOneAction)

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

	const syncBuildDoNotEncryptMessageIfAny = (
		from: AddressT,
	): Result<TransactionIntent, Error> =>
		intendedActionsFromIntermediateActions(from).map(
			({ intendedActions }) => ({
				actions: intendedActions,
				message: maybePlaintextMsgToEncrypt
					.map((msg) => ({
						encryptionScheme: EncryptionSchemeName.DO_NOT_ENCRYPT,
						msg,
					}))
					.getOrUndefined(),
			}),
		)

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
						getUniqueAddresses(action).forEach((a) => {
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
		options: TransactionIntentBuilderOptions,
	): Observable<TransactionIntent> => {
		if (isTransactionIntentBuilderDoNotEncryptInput(options)) {
			return options.spendingSender.pipe(
				mergeMap((from: AddressT) =>
					toObservableFromResult(
						syncBuildDoNotEncryptMessageIfAny(from),
					),
				),
			)
		}

		if (!isTransactionIntentBuilderEncryptInput(options)) {
			throw new Error('Incorrect implementation')
		}

		const encryptingAccount$ = options.encryptMessageIfAnyWithAccount
		const spendingSender: Observable<AddressT> =
			options.spendingSender ??
			options.encryptMessageIfAnyWithAccount.pipe(
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
										log.info(`Successfully built transaction with encrypted message. Actions: ${intendedActionsFrom.intendedActions.map(action => action.type)}`)
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
							log.info(`Successfully built transaction. Actions: ${intendedActionsFrom.intendedActions.map(action => action.type)}`)
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
		__syncBuildDoNotEncryptMessageIfAny: syncBuildDoNotEncryptMessageIfAny,
	}

	return {
		...snapshotBuilderState(),
		...methods,
	}
}

export const TransactionIntentBuilder = {
	create,
}

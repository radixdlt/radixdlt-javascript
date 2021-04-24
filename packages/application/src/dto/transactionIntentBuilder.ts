import {
	ActionInput,
	ActionType,
	ExecutedAction,
	IntendedAction,
	IntendedStakeTokensAction,
	IntendedTransferTokensAction,
	IntendedUnstakeTokensAction,
	StakeTokensInput,
	TransferTokensInput,
	UnstakeTokensInput,
} from '../actions'
import {
	TransactionIntent,
	TransactionIntentBuilderDoNotEncryptInput,
	TransactionIntentBuilderDoNotEncryptOption,
	TransactionIntentBuilderEncryptOption,
	TransactionIntentBuilderOptions,
	TransactionIntentBuilderState,
	TransactionIntentBuilderT,
} from './_types'
import {
	AccountT,
	AccountAddressT,
	isAccountAddress,
	toObservableFromResult,
	isResourceIdentifier,
} from '@radixdlt/account'
import { isObservable, Observable, of, throwError } from 'rxjs'
import { map, mergeMap } from 'rxjs/operators'
import {
	IntendedTransferTokens,
	isTransferTokensInput,
	IntendedStakeTokens,
	isStakeTokensInput,
	IntendedUnstakeTokens,
	isUnstakeTokensInput,
} from '../actions'
import { combine, err, ok, Result } from 'neverthrow'
import {
	EncryptedMessageT,
	MessageEncryption,
	PublicKey,
} from '@radixdlt/crypto'
import { Option } from 'prelude-ts'
import { isAmount } from '@radixdlt/primitives'
import { log } from '@radixdlt/util'
import { MessageInTransaction } from '../_types'

type IntendedActionsFrom = Readonly<{
	intendedActions: IntendedAction[]
	from: AccountAddressT
}>

export const singleRecipientFromActions = (
	mine: PublicKey,
	actions: UserAction[],
): Result<PublicKey, Error> => {
	const setOfStrings = new Set<string>()
	setOfStrings.add(mine.toString())

	const others: PublicKey[] = actions.reduce(
		(acc: PublicKey[], action: UserAction) => {
			const uniqueAddressesOfAction = getUniqueAddresses(action)
			uniqueAddressesOfAction.forEach((a) => {
				const pkString = a.publicKey.toString()
				if (!setOfStrings.has(pkString)) {
					acc.push(a.publicKey)
					setOfStrings.add(pkString)
				}
			})
			return acc
		},
		[] as PublicKey[],
	)

	if (others.length > 1) {
		const errMsg = `Cannot encrypt/decrypt message for a transaction containing more than one recipient addresses.`
		log.alert(errMsg)
		throw new Error(errMsg)
	}

	const toSelf = others.length === 0
	if (toSelf) {
		log.debug(`Encrypted message is to oneself.`)
	}

	return ok(toSelf ? mine : others[0])
}

type ActorsInEncryption = {
	encryptingAccount: AccountT
	singleRecipientPublicKey: PublicKey
}

const ensureSingleRecipient = (
	input: Readonly<{
		intendedActionsFrom: IntendedActionsFrom
		encryptingAccount: AccountT
	}>,
): Observable<ActorsInEncryption> => {
	return input.encryptingAccount.derivePublicKey().pipe(
		mergeMap((pk: PublicKey) => {
			return toObservableFromResult(
				singleRecipientFromActions(
					pk,
					input.intendedActionsFrom.intendedActions,
				),
			).pipe(
				map((singleRecipientPublicKey) => {
					return {
						encryptingAccount: input.encryptingAccount,
						singleRecipientPublicKey: singleRecipientPublicKey,
					}
				}),
			)
		}),
	)
}

type IntermediateAction = ActionInput & {
	type: 'transfer' | 'stake' | 'unstake'
}

const mustHaveAtLeastOneAction = new Error(
	'A transaction intent must contain at least one of the following actions: TransferToken, StakeTokens or UnstakeTokens',
)

export const isIntendedTransferTokensAction = (
	something: unknown,
): something is IntendedTransferTokensAction => {
	const inspection = something as IntendedTransferTokensAction
	return (
		inspection.type === ActionType.TOKEN_TRANSFER &&
		isAccountAddress(inspection.from) &&
		isAccountAddress(inspection.to) &&
		isAmount(inspection.amount) &&
		isResourceIdentifier(inspection.tokenIdentifier)
	)
}

export const isIntendedStakeTokensAction = (
	something: unknown,
): something is IntendedStakeTokensAction => {
	const inspection = something as IntendedStakeTokensAction
	return (
		inspection.type === ActionType.STAKE_TOKENS &&
		isAccountAddress(inspection.from) &&
		isAccountAddress(inspection.validator) &&
		isAmount(inspection.amount)
	)
}

export const isIntendedUnstakeTokensAction = (
	something: unknown,
): something is IntendedUnstakeTokensAction => {
	const inspection = something as IntendedUnstakeTokensAction
	return (
		inspection.type === ActionType.UNSTAKE_TOKENS &&
		isAccountAddress(inspection.from) &&
		isAccountAddress(inspection.validator) &&
		isAmount(inspection.amount)
	)
}

type UserAction = IntendedAction | ExecutedAction
const getUniqueAddresses = (action: UserAction): AccountAddressT[] => {
	if (isIntendedTransferTokensAction(action)) {
		return [action.to, action.from]
	} else if (isIntendedStakeTokensAction(action)) {
		return [action.from]
	} else if (isIntendedUnstakeTokensAction(action)) {
		return [action.from]
	} else {
		throw new Error('Incorrect impl')
	}
}

const isTransactionIntentBuilderEncryptInput = (
	something: unknown,
): something is TransactionIntentBuilderEncryptOption => {
	const inspection = something as TransactionIntentBuilderEncryptOption
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

const isTransactionIntentBuilderDoNotEncryptOption = (
	something: unknown,
): something is TransactionIntentBuilderDoNotEncryptOption => {
	const inspection = something as TransactionIntentBuilderDoNotEncryptOption
	return (
		inspection.skipEncryptionOfMessageIfAny !== undefined &&
		isTransactionIntentBuilderDoNotEncryptInput(
			inspection.skipEncryptionOfMessageIfAny,
		)
	)
}

const create = (): TransactionIntentBuilderT => {
	const intermediateActions: IntermediateAction[] = []
	let maybePlaintextMsgToEncrypt: Option<MessageInTransaction> = Option.none()
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
		newMessage: MessageInTransaction,
	): TransactionIntentBuilderT => {
		maybePlaintextMsgToEncrypt = Option.some(newMessage)
		return {
			...methods,
			...snapshotBuilderState(),
		}
	}

	const intendedActionsFromIntermediateActions = (
		from: AccountAddressT,
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
		from: AccountAddressT,
	): Result<TransactionIntent, Error> => {
		return intendedActionsFromIntermediateActions(from).map(
			({ intendedActions }) => ({
				actions: intendedActions,
				message: maybePlaintextMsgToEncrypt
					.map((msg) =>
						MessageEncryption.encodePlaintext(msg.plaintext),
					)
					.getOrUndefined(),
			}),
		)
	}

	const build = (
		options: TransactionIntentBuilderOptions,
	): Observable<TransactionIntent> => {
		if (isTransactionIntentBuilderDoNotEncryptOption(options)) {
			if (
				maybePlaintextMsgToEncrypt
					.map((m) => m.encrypt)
					.getOrElse(false)
			) {
				const errMsg = `Message in transaction specifies it should be encrypted, but input to TransactionIntentBuilder build method specifies that it (the builder) should not encrypt the message, and does not provide any account with which we can perform encryption.`
				console.error(errMsg)
				log.error(errMsg)
				return throwError(new Error(errMsg))
			}

			return options.skipEncryptionOfMessageIfAny.spendingSender.pipe(
				mergeMap((from: AccountAddressT) =>
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
		const spendingSender: Observable<AccountAddressT> =
			options.spendingSender ??
			options.encryptMessageIfAnyWithAccount.pipe(
				mergeMap((a) => a.deriveAddress()),
			)
		return spendingSender.pipe(
			mergeMap((from: AccountAddressT) =>
				toObservableFromResult(
					intendedActionsFromIntermediateActions(from),
				),
			),
			mergeMap(
				(
					intendedActionsFrom: IntendedActionsFrom,
				): Observable<TransactionIntent> => {
					const transactionIntentWithoutEncryption = (
						plaintextMessage?: string,
					): Observable<TransactionIntent> => {
						log.info(
							`Successfully built transaction. Actions: ${intendedActionsFrom.intendedActions
								.map((action) => action.type)
								.toString()}`,
						)
						return of({
							actions: intendedActionsFrom.intendedActions,
							message:
								plaintextMessage !== undefined
									? MessageEncryption.encodePlaintext(
											plaintextMessage,
									  )
									: undefined,
						})
					}

					return maybePlaintextMsgToEncrypt.match({
						Some: (msgInTx) => {
							if (!msgInTx.encrypt) {
								const errMsg =
									'You are trying to encrypt a message which was specified not to be encrypted.'
								console.error(errMsg)
								log.error(errMsg)
								return throwError(new Error(errMsg))
							}

							return encryptingAccount$.pipe(
								mergeMap(
									(
										encryptingAccount: AccountT,
									): Observable<ActorsInEncryption> =>
										ensureSingleRecipient({
											intendedActionsFrom,
											encryptingAccount,
										}),
								),
								mergeMap(
									(
										actors: ActorsInEncryption,
									): Observable<EncryptedMessageT> => {
										return actors.encryptingAccount.encrypt(
											{
												plaintext: msgInTx.plaintext,
												publicKeyOfOtherParty:
													actors.singleRecipientPublicKey,
											},
										)
									},
								),
								map(
									(
										encryptedMessage: EncryptedMessageT,
									): TransactionIntent => {
										log.info(
											`Successfully built transaction with encrypted message. Actions: ${intendedActionsFrom.intendedActions
												.map((action) => action.type)
												.toString()}`,
										)
										return {
											actions:
												intendedActionsFrom.intendedActions,
											message: encryptedMessage.combined(),
										}
									},
								),
							)
						},
						None: () =>
							transactionIntentWithoutEncryption(undefined),
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
